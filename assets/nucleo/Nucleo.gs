/**
 * ============================================================
 *  NÚCLEO · skill "apps-na-planilha" · versão 1
 * ============================================================
 *  Este arquivo é igual em todo app feito com a skill. Não edite:
 *  quando houver versão nova, ela vem inteira. O que muda de um app
 *  para outro fica no arquivo App, que descreve o app em duas partes:
 *    APP      nome, fuso horário, tarefas automáticas e ajustes
 *    TABELAS  as abas da planilha, as colunas e o tipo de cada coluna
 *
 *  O que o núcleo faz
 *  - setup(): cria as abas que faltam e guarda o ID da planilha.
 *  - Lê e grava linhas com segurança: texto nunca vira fórmula, datas
 *    não pulam de dia e duas gravações nunca acontecem ao mesmo tempo.
 *  - Confere quem está usando (exigirDono_) e valida o que chega de fora.
 *  Tarefas automáticas ficam no arquivo fixo Tarefas, só nos apps que têm.
 *
 *  Regra de ouro: funções terminadas em "_" são internas, e ninguém de
 *  fora consegue chamá-las. Sem "_" ficam só as que o Google ou a tela
 *  do app precisam chamar: aqui, setup e incluir.
 *
 *  Tipos de coluna: id, texto, opcao, numero, dinheiro, data, dataHora, marcador
 * ============================================================
 */

var NUCLEO_VERSAO = '1';

var FORMATOS_ = {
  data: 'dd/mm/yyyy',
  dataHora: 'dd/mm/yyyy hh:mm',
  dinheiro: '"R$" #,##0.00'
};

var TRAVA_ = { ativa: false };

// ============================================================
// Preparação
// ============================================================

/** Rode uma vez pelo editor. Pode rodar de novo: não apaga nem duplica nada. */
function setup() {
  exigirDono_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra o editor pela planilha (Extensões > Apps Script) e rode o setup de lá.');
  PropertiesService.getScriptProperties().setProperty('PLANILHA_ID', ss.getId());
  var criadas = Object.keys(TABELAS).filter(function (chave) { return criarAbaSeFaltar_(ss, chave); });
  criadas.forEach(function (chave) { aplicarValidacoes_(ss, chave); });
  if (typeof aoPreparar_ === 'function') aoPreparar_(ss);
  return criadas.length
    ? 'Planilha pronta. Abas criadas: ' + criadas.map(function (c) { return TABELAS[c].aba; }).join(', ') + '.'
    : 'Planilha pronta. Nenhuma aba nova.';
}

function criarAbaSeFaltar_(ss, chave) {
  var def = TABELAS[chave];
  if (def.externa || ss.getSheetByName(def.aba)) return false;
  var abas = ss.getSheets();
  var unicaVazia = abas.length === 1 && abas[0].getLastRow() === 0 && abas[0].getLastColumn() === 0;
  var aba = unicaVazia ? abas[0].setName(def.aba) : ss.insertSheet(def.aba);
  var campos = Object.keys(def.colunas);
  aba.getRange(1, 1, 1, campos.length)
    .setValues([campos.map(function (c) { return def.colunas[c].titulo; })])
    .setFontWeight('bold');
  aba.setFrozenRows(1);
  campos.forEach(function (campo, i) {
    var formato = FORMATOS_[def.colunas[campo].tipo];
    if (formato) aba.getRange(2, i + 1, aba.getMaxRows() - 1, 1).setNumberFormat(formato);
  });
  (def.inicial || []).forEach(function (linha) {
    var valores = Array.isArray(linha) ? linha : [linha];
    var dados = {};
    campos.forEach(function (campo, i) { if (i < valores.length) dados[campo] = valores[i]; });
    adicionarLinha_(chave, dados);
  });
  return true;
}

function aplicarValidacoes_(ss, chave) {
  var def = TABELAS[chave];
  var aba = ss.getSheetByName(def.aba);
  var linhas = aba.getMaxRows() - 1;
  Object.keys(def.colunas).forEach(function (campo, i) {
    var col = def.colunas[campo];
    var regra = null;
    if (col.tipo === 'marcador') {
      regra = SpreadsheetApp.newDataValidation().requireCheckbox();
    } else if (col.tipo === 'opcao' && col.opcoes) {
      regra = SpreadsheetApp.newDataValidation().requireValueInList(col.opcoes, true);
    } else if (col.tipo === 'opcao' && col.opcoesDe) {
      var origem = ss.getSheetByName(TABELAS[col.opcoesDe].aba);
      regra = SpreadsheetApp.newDataValidation().requireValueInRange(origem.getRange(2, 1, origem.getMaxRows() - 1, 1), true);
    }
    if (regra) aba.getRange(2, i + 1, linhas, 1).setDataValidation(regra.setAllowInvalid(false).build());
  });
}

// ============================================================
// Ler e gravar linhas
// ============================================================

/**
 * Todas as linhas preenchidas de uma tabela, como objetos { campo: valor, _linha: n }.
 * As colunas são achadas pelo título na linha 1, então colunas extras ou fora
 * de ordem na planilha não atrapalham.
 */
function lerLinhas_(chave) {
  var def = tabela_(chave);
  var aba = aba_(chave);
  var total = aba.getLastRow() - 1;
  if (total < 1) return [];
  var mapa = mapaDe_(aba, def);
  var campos = Object.keys(def.colunas);
  var fuso = aba.getParent().getSpreadsheetTimeZone();
  var linhas = [];
  aba.getRange(2, 1, total, mapa.largura).getValues().forEach(function (valores, i) {
    var obj = { _linha: i + 2 };
    var vazia = true;
    campos.forEach(function (campo) {
      var tipo = def.colunas[campo].tipo;
      var bruto = valores[mapa.colunas[campo] - 1];
      if (tipo !== 'marcador' && bruto !== '' && bruto !== null) vazia = false;
      obj[campo] = lerCelula_(tipo, bruto, fuso);
    });
    if (!vazia) linhas.push(obj);
  });
  return linhas;
}

/** Grava uma linha nova. Campos de tipo id e dataHora com padrao 'agora' se preenchem sozinhos. */
function adicionarLinha_(chave, dados) {
  var def = tabela_(chave);
  var campos = Object.keys(def.colunas);
  var registro = {};
  var celulas = {};
  campos.forEach(function (campo) {
    var col = def.colunas[campo];
    var valor = dados[campo];
    if (col.tipo === 'id' && !valor) valor = Utilities.getUuid();
    if (col.tipo === 'dataHora' && !valor && col.padrao === 'agora') valor = new Date();
    registro[campo] = valor;
    celulas[campo] = paraCelula_(col.tipo, valor);
  });
  comTrava_(function () {
    var aba = aba_(chave);
    var mapa = mapaDe_(aba, def);
    var linha = ultimaLinhaComDados_(aba, def, mapa) + 1;
    if (linha > aba.getMaxRows()) aba.insertRowsAfter(aba.getMaxRows(), 50);
    campos.forEach(function (campo) {
      var tipo = def.colunas[campo].tipo;
      var celula = aba.getRange(linha, mapa.colunas[campo]);
      if (tipo === 'marcador') celula.insertCheckboxes();
      if (FORMATOS_[tipo]) celula.setNumberFormat(FORMATOS_[tipo]);
    });
    gravarNaLinha_(aba, linha, mapa.colunas, celulas);
  });
  return registro;
}

/** Muda campos de uma linha achada pelo ID. */
function atualizarLinha_(chave, id, mudancas) {
  var def = tabela_(chave);
  var novos = {};
  Object.keys(mudancas).forEach(function (campo) {
    var col = def.colunas[campo];
    if (!col || col.tipo === 'id') throw new Error('Campo inválido: ' + campo);
    novos[campo] = paraCelula_(col.tipo, mudancas[campo]);
  });
  comTrava_(function () {
    var linha = acharLinha_(chave, id);
    if (!linha) throw new Error('Esse registro não existe mais. Atualize a tela.');
    var aba = aba_(chave);
    var mapa = mapaDe_(aba, def);
    Object.keys(novos).forEach(function (campo) {
      var formato = FORMATOS_[def.colunas[campo].tipo];
      if (formato) aba.getRange(linha, mapa.colunas[campo]).setNumberFormat(formato);
    });
    gravarNaLinha_(aba, linha, mapa.colunas, novos);
  });
}

/** Apaga a linha achada pelo ID. */
function excluirLinha_(chave, id) {
  comTrava_(function () {
    var linha = acharLinha_(chave, id);
    if (!linha) throw new Error('Esse registro não existe mais. Atualize a tela.');
    aba_(chave).deleteRow(linha);
  });
}

/** Número da linha com esse ID, ou 0. */
function acharLinha_(chave, id) {
  var def = tabela_(chave);
  var campoId = Object.keys(def.colunas).filter(function (c) { return def.colunas[c].tipo === 'id'; })[0];
  if (!campoId) throw new Error('A aba "' + def.aba + '" não tem coluna de ID.');
  var aba = aba_(chave);
  var total = aba.getLastRow() - 1;
  if (total < 1) return 0;
  var ids = aba.getRange(2, mapaDe_(aba, def).colunas[campoId], total, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

/** Número da coluna de cada campo (1 = coluna A), achado pelo título. Útil em gatilhos de edição. */
function colunasDe_(chave) {
  return mapaDe_(aba_(chave), tabela_(chave)).colunas;
}

function tabela_(chave) {
  var def = TABELAS[chave];
  if (!def) throw new Error('Tabela desconhecida: ' + chave);
  return def;
}

function aba_(chave) {
  var def = tabela_(chave);
  var aba = planilha_().getSheetByName(def.aba);
  if (!aba) throw new Error('A aba "' + def.aba + '" não existe. ' + (def.externa ? 'Ligue o formulário à planilha.' : 'Rode a função setup de novo.'));
  return aba;
}

/**
 * Num app da Web o Google não informa a planilha "ativa", por isso o setup
 * guarda o ID dela. No editor, nos menus e nos gatilhos a planilha ativa
 * existe e corrige o ID guardado se ele estiver velho (ex.: depois de uma cópia).
 */
function planilha_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PLANILHA_ID');
  var ativa = null;
  try { ativa = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ativa = null; }
  if (ativa) {
    if (ativa.getId() !== id) props.setProperty('PLANILHA_ID', ativa.getId());
    return ativa;
  }
  if (!id) throw new Error('A planilha ainda não foi preparada. Rode a função setup uma vez no editor.');
  return SpreadsheetApp.openById(id);
}

/** Onde está cada campo na aba, pelo título da coluna na linha 1. */
function mapaDe_(aba, def) {
  var largura = Math.max(aba.getLastColumn(), 1);
  var titulos = aba.getRange(1, 1, 1, largura).getValues()[0].map(function (t) { return String(t).trim().toLowerCase(); });
  var colunas = {};
  Object.keys(def.colunas).forEach(function (campo) {
    var i = titulos.indexOf(def.colunas[campo].titulo.trim().toLowerCase());
    if (i < 0) throw new Error('A aba "' + def.aba + '" não tem a coluna "' + def.colunas[campo].titulo + '". Confira os títulos na linha 1.');
    colunas[campo] = i + 1;
  });
  return { colunas: colunas, largura: largura };
}

/**
 * Última linha com algum dado nas colunas da tabela. Caixas de seleção vazias e
 * colunas extras da pessoa (como fórmulas puxadas até o fim) não contam.
 */
function ultimaLinhaComDados_(aba, def, mapa) {
  var ultima = aba.getLastRow();
  if (ultima < 2) return 1;
  var campos = Object.keys(def.colunas).filter(function (c) { return def.colunas[c].tipo !== 'marcador'; });
  var valores = aba.getRange(2, 1, ultima - 1, mapa.largura).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {
    var temDado = campos.some(function (c) {
      var v = valores[i][mapa.colunas[c] - 1];
      return v !== '' && v !== null;
    });
    if (temDado) return i + 2;
  }
  return 1;
}

/** Grava os valores em blocos de colunas vizinhas, sem tocar nas outras colunas da linha. */
function gravarNaLinha_(aba, linha, colunas, valores) {
  var ordem = Object.keys(valores).sort(function (a, b) { return colunas[a] - colunas[b]; });
  var bloco = [];
  ordem.forEach(function (campo, i) {
    bloco.push(campo);
    var proximo = ordem[i + 1];
    if (!proximo || colunas[proximo] !== colunas[campo] + 1) {
      aba.getRange(linha, colunas[bloco[0]], 1, bloco.length)
        .setValues([bloco.map(function (c) { return valores[c]; })]);
      bloco = [];
    }
  });
}

function lerCelula_(tipo, valor, fuso) {
  if (tipo === 'marcador') return valor === true || String(valor).toUpperCase() === 'TRUE';
  if (valor === '' || valor === null) return tipo === 'numero' || tipo === 'dinheiro' ? null : '';
  if (tipo === 'numero' || tipo === 'dinheiro') {
    var n = typeof valor === 'number' ? valor : paraNumero_(valor);
    return isFinite(n) ? n : null;
  }
  if (tipo === 'data') return isoDe_(valor, fuso);
  if (tipo === 'dataHora') return valor instanceof Date ? Utilities.formatDate(valor, fuso, "yyyy-MM-dd'T'HH:mm") : String(valor);
  return String(valor);
}

function paraCelula_(tipo, valor) {
  if (tipo === 'marcador') return valor === true;
  if (valor === undefined || valor === null || valor === '') return '';
  if (tipo === 'numero' || tipo === 'dinheiro') {
    var n = typeof valor === 'number' ? valor : paraNumero_(valor);
    if (!isFinite(n)) throw new Error('Valor numérico inválido.');
    return n;
  }
  if (tipo === 'data') return serialDe_(data_(valor, 'Data'));
  if (tipo === 'dataHora') {
    if (!(valor instanceof Date) || isNaN(valor.getTime())) throw new Error('Data e hora inválidas.');
    return valor;
  }
  return celulaTexto_(String(valor));
}

/** Uma gravação por vez. Pode ser chamada por dentro de outra: não trava a si mesma. */
function comTrava_(fn) {
  if (TRAVA_.ativa) return fn();
  var trava = LockService.getScriptLock();
  if (!trava.tryLock(10000)) throw new Error('O app está ocupado. Tente de novo em alguns segundos.');
  TRAVA_.ativa = true;
  try {
    return fn();
  } finally {
    TRAVA_.ativa = false;
    trava.releaseLock();
  }
}

// ============================================================
// Página do app da Web
// ============================================================

/** Monta a página a partir de um arquivo HTML do projeto (que inclui a base com <?!= incluir('base'); ?>). */
function paginaDoApp_(arquivo) {
  return HtmlService.createTemplateFromFile(arquivo).evaluate()
    .setTitle(APP.nome)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** Página simples com um recado. O texto é escapado pelo próprio modelo (<?= ?>). */
function paginaDeAviso_(mensagem) {
  var modelo = HtmlService.createTemplate('<p style="font-family:sans-serif;padding:24px"><?= mensagem ?></p>');
  modelo.mensagem = mensagem;
  return modelo.evaluate().setTitle(APP.nome);
}

/** Inclui um pedaço fixo da tela. Só libera os arquivos da lista. */
function incluir(nome) {
  var permitidos = ['base'].concat(APP.partes || []);
  if (permitidos.indexOf(nome) < 0) throw new Error('Arquivo não permitido.');
  return HtmlService.createHtmlOutputFromFile(nome).getContent();
}

// ============================================================
// Quem está usando
// ============================================================

/**
 * Verdadeiro só quando quem está usando é a própria conta com que o código
 * roda: no app da Web, quem publicou; no editor e nos menus, quem clicou.
 * Para as outras pessoas, o Google não informa o e-mail (vem vazio).
 * Não use em gatilhos: eles rodam sem ninguém na tela.
 */
function ehDono_() {
  var quem = Session.getActiveUser().getEmail();
  var dono = Session.getEffectiveUser().getEmail();
  return Boolean(quem) && quem.toLowerCase() === String(dono).toLowerCase();
}

function exigirDono_() {
  if (!ehDono_()) throw new Error('Acesso não autorizado.');
}

// ============================================================
// Validação do que chega de fora
// ============================================================

function objeto_(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('Dados inválidos.');
  return valor;
}

function texto_(valor, rotulo, opcoes) {
  opcoes = opcoes || {};
  var s = String(valor == null ? '' : valor);
  s = opcoes.multilinha
    ? s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  s = s.trim();
  if (!s && opcoes.obrigatorio !== false) throw new Error(rotulo + ': preencha este campo.');
  var max = opcoes.max || 200;
  if (s.length > max) throw new Error(rotulo + ': use no máximo ' + max + ' caracteres.');
  return s;
}

function numero_(valor, rotulo, opcoes) {
  opcoes = opcoes || {};
  var n = typeof valor === 'number' ? valor : paraNumero_(valor);
  if (!isFinite(n)) throw new Error(rotulo + ': digite um número válido.');
  if (opcoes.min != null && n < opcoes.min) throw new Error(rotulo + ': o mínimo é ' + opcoes.min + '.');
  if (opcoes.max != null && n > opcoes.max) throw new Error(rotulo + ': o máximo é ' + opcoes.max + '.');
  return arred_(n);
}

/** Data no formato aaaa-mm-dd (o que o campo de data do navegador envia). */
function data_(valor, rotulo) {
  var s = String(valor == null ? '' : valor).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  var d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  var valida = d && d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  if (!valida || +m[1] < 2000 || +m[1] > 2100) throw new Error(rotulo + ': data inválida.');
  return s;
}

function opcao_(valor, rotulo, lista) {
  var s = String(valor == null ? '' : valor).trim();
  if (lista.indexOf(s) < 0) throw new Error(rotulo + ': escolha uma opção da lista.');
  return s;
}

function simNao_(valor, rotulo) {
  if (typeof valor !== 'boolean') throw new Error(rotulo + ': valor inválido.');
  return valor;
}

function id_(valor) {
  var s = String(valor == null ? '' : valor).trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) throw new Error('Registro inválido.');
  return s;
}

/**
 * Texto vai para a planilha sempre com um apóstrofo na frente. A planilha
 * esconde o apóstrofo e guarda o conteúdo como texto puro, então algo como
 * =IMPORTXML(...) nunca vira fórmula, e "0012" ou "1/2" não viram número ou data.
 */
function celulaTexto_(s) {
  return "'" + s;
}

// ============================================================
// Datas e números
// ============================================================

function hojeISO_() {
  return Utilities.formatDate(new Date(), APP.fuso || Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Número de série da planilha para uma data aaaa-mm-dd: grava o dia certo em qualquer fuso. */
function serialDe_(iso) {
  var p = iso.split('-').map(Number);
  return (Date.UTC(p[0], p[1] - 1, p[2]) - Date.UTC(1899, 11, 30)) / 86400000;
}

function isoDe_(valor, fuso) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return Utilities.formatDate(valor, fuso, 'yyyy-MM-dd');
  if (typeof valor === 'number' && valor > 0) {
    var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(valor) * 86400000);
    return d.getUTCFullYear() + '-' + dois_(d.getUTCMonth() + 1) + '-' + dois_(d.getUTCDate());
  }
  var s = String(valor == null ? '' : valor).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + dois_(m[2]) + '-' + dois_(m[1]);
  return '';
}

function somarDias_(iso, dias) {
  var p = iso.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + dias));
  return d.getUTCFullYear() + '-' + dois_(d.getUTCMonth() + 1) + '-' + dois_(d.getUTCDate());
}

/** Aceita "12,50", "12.50", "1.234,56" e "R$ 12,50". */
function paraNumero_(valor) {
  var s = String(valor == null ? '' : valor).trim().replace(/^R\$/i, '').replace(/\s/g, '');
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

function dois_(n) {
  return String(n).padStart(2, '0');
}

function arred_(n) {
  return Math.round(n * 100) / 100;
}
