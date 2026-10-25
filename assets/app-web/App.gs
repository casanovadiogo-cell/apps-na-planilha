/**
 * ============================================================
 *  MEU APP · arquivo do app (é aqui que cada app muda)
 * ============================================================
 *  O que faz:  registra itens com data, descrição, categoria e valor,
 *              e mostra o total do mês. (Troque pela descrição do seu app.)
 *  Formato:    app da Web, só para o dono ("Somente eu").
 *  Arquivos:   Nucleo (fixo) · App (este) · base (fixo) · index (a tela)
 *  Abas:       Registros · um registro por linha
 *              Categorias · lista que você edita à vontade na planilha
 *  Primeira vez: rode setup pelo editor e publique como app da Web.
 * ============================================================
 */

var APP = {
  nome: 'Meu App',
  fuso: 'America/Sao_Paulo',
  limiteLista: 60 // quantos registros recentes a tela recebe
};

var TABELAS = {
  registros: {
    aba: 'Registros',
    colunas: {
      id: { titulo: 'ID', tipo: 'id' },
      data: { titulo: 'Data', tipo: 'data' },
      descricao: { titulo: 'Descrição', tipo: 'texto' },
      categoria: { titulo: 'Categoria', tipo: 'opcao', opcoesDe: 'categorias' },
      valor: { titulo: 'Valor', tipo: 'dinheiro' },
      criadoEm: { titulo: 'Criado em', tipo: 'dataHora', padrao: 'agora' }
    }
  },
  categorias: {
    aba: 'Categorias',
    colunas: { nome: { titulo: 'Categoria', tipo: 'texto' } },
    inicial: ['Mercado', 'Transporte', 'Casa', 'Lazer', 'Outros']
  }
};

function doGet() {
  if (!ehDono_()) return paginaDeAviso_('Acesso não autorizado.');
  return paginaDoApp_('index');
}

// ============================================================
// FUNÇÕES QUE A TELA CHAMA
// Cada uma confere o dono, valida a entrada e devolve só o necessário.
// ============================================================

/** Tudo o que a tela precisa para se desenhar. */
function carregarTela() {
  exigirDono_();
  var hoje = hojeISO_();
  var registros = lerLinhas_('registros');
  return {
    nome: APP.nome,
    hoje: hoje,
    categorias: lerCategorias_(),
    resumo: resumirMes_(registros, hoje.slice(0, 7)),
    recentes: maisRecentes_(registros, APP.limiteLista).map(function (r) {
      return { id: r.id, data: r.data, descricao: r.descricao, categoria: r.categoria, valor: r.valor || 0 };
    })
  };
}

function salvarRegistro(dados) {
  exigirDono_();
  dados = objeto_(dados);
  adicionarLinha_('registros', {
    data: data_(dados.data, 'Data'),
    descricao: texto_(dados.descricao, 'Descrição', { max: 120 }),
    categoria: opcao_(dados.categoria, 'Categoria', lerCategorias_()),
    valor: numero_(dados.valor, 'Valor', { min: 0.01, max: 1000000 })
  });
  return carregarTela();
}

function excluirRegistro(id) {
  exigirDono_();
  excluirLinha_('registros', id_(id));
  return carregarTela();
}

// ============================================================
// Regras e contas do app (internas)
// ============================================================

function lerCategorias_() {
  return lerLinhas_('categorias')
    .map(function (c) { return c.nome.trim(); })
    .filter(function (c, i, todas) { return c && todas.indexOf(c) === i; });
}

function resumirMes_(registros, mes) {
  var total = 0;
  var porCategoria = {};
  registros.forEach(function (r) {
    if (r.data.slice(0, 7) !== mes) return;
    total += r.valor || 0;
    porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + (r.valor || 0);
  });
  var categorias = Object.keys(porCategoria)
    .map(function (c) { return { nome: c, valor: arred_(porCategoria[c]) }; })
    .sort(function (a, b) { return b.valor - a.valor; });
  return { mes: mes, total: arred_(total), categorias: categorias };
}

/** Do dia mais novo para o mais antigo; no mesmo dia, o último lançado primeiro. */
function maisRecentes_(registros, limite) {
  return registros.slice().reverse()
    .sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : 0; })
    .slice(0, limite);
}
