/**
 * ============================================================
 *  CADERNETA DO PET · arquivo do app (é aqui que cada app muda)
 * ============================================================
 *  O que faz:  lista os cuidados que se repetem (vacina, vermífugo,
 *              banho). Marcar "Fiz hoje" registra a data e calcula a
 *              próxima. Todo dia, um e-mail avisa o que vence em breve.
 *  Formato:    planilha + automações. A planilha é a tela: use no
 *              computador ou no app Planilhas do celular.
 *  Arquivos:   Nucleo (fixo) · Tarefas (fixo) · App (este)
 *  Abas:       Cuidados · um cuidado por linha
 *  Primeira vez: rode setup e depois instalarGatilhos pelo editor.
 * ============================================================
 */

var APP = {
  nome: 'Caderneta do Pet',
  fuso: 'America/Sao_Paulo',
  diasDeAviso: 7,
  tarefas: { enviarLembretes: 8 } // todo dia, entre 8h e 9h
};

var TABELAS = {
  cuidados: {
    aba: 'Cuidados',
    colunas: {
      pet: { titulo: 'Pet', tipo: 'texto' },
      cuidado: { titulo: 'Cuidado', tipo: 'texto' },
      repetirDias: { titulo: 'Repetir a cada (dias)', tipo: 'numero' },
      ultima: { titulo: 'Última vez', tipo: 'data' },
      proxima: { titulo: 'Próxima vez', tipo: 'data' },
      feito: { titulo: 'Fiz hoje', tipo: 'marcador' }
    },
    inicial: [
      ['Exemplo', 'Vacina V10', 365],
      ['Exemplo', 'Vermífugo', 90],
      ['Exemplo', 'Banho', 15]
    ]
  }
};

/**
 * Gatilho simples do Google: roda sozinho a cada edição feita por uma
 * pessoa, inclusive pelo app do celular, e não precisa de permissão.
 * Marcar "Fiz hoje" grava a data de hoje, calcula a próxima e desmarca.
 */
function onEdit(e) {
  if (!e || !e.range || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  var aba = e.range.getSheet();
  if (aba.getName() !== TABELAS.cuidados.aba || e.range.getRow() < 2) return;
  var col = colunasDe_('cuidados');
  if (e.range.getColumn() !== col.feito || e.range.getValue() !== true) return;
  var linha = e.range.getRow();
  var hoje = hojeISO_();
  var dias = Number(aba.getRange(linha, col.repetirDias).getValue()) || 0;
  aba.getRange(linha, col.ultima).setValue(serialDe_(hoje)).setNumberFormat('dd/mm/yyyy');
  aba.getRange(linha, col.proxima)
    .setValue(dias > 0 ? serialDe_(somarDias_(hoje, dias)) : '')
    .setNumberFormat('dd/mm/yyyy');
  e.range.setValue(false);
}

/** Roda todo dia pelo gatilho (APP.tarefas). Manda e-mail só para o dono, só quando há algo para avisar. */
function enviarLembretes() {
  var hoje = hojeISO_();
  var limite = somarDias_(hoje, APP.diasDeAviso);
  var proximos = lerLinhas_('cuidados')
    .filter(function (c) { return c.proxima && c.proxima <= limite; })
    .sort(function (a, b) { return a.proxima < b.proxima ? -1 : 1; });
  if (!proximos.length) return;
  var linhas = proximos.map(function (c) {
    var quando = c.proxima.split('-').reverse().join('/');
    return '- ' + (c.proxima < hoje ? 'atrasado desde ' : '') + quando + ': ' + c.cuidado + ' (' + c.pet + ')';
  });
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: APP.nome + ': ' + proximos.length + ' cuidado(s) chegando',
    body: linhas.join('\n') + '\n\nQuando fizer, marque "Fiz hoje" na planilha.'
  });
}
