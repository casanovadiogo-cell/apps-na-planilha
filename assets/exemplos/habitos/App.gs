/**
 * ============================================================
 *  HÁBITOS ATÔMICOS · arquivo do app (é aqui que cada app muda)
 * ============================================================
 *  O que faz:  acompanha hábitos com as ideias do livro Atomic Habits.
 *              Cada hábito tem uma identidade ("quem eu quero ser"), uma
 *              versão de 2 minutos, um quando-e-onde e uma recompensa.
 *              Marcar o dia conta um voto para a identidade; a versão de
 *              2 minutos também conta. Se ontem passou, o app lembra de
 *              não falhar duas vezes.
 *  Formato:    app da Web, só para o dono ("Somente eu").
 *  Arquivos:   Nucleo (fixo) · App (este) · base (fixo) · index (a tela)
 *  Abas:       Hábitos · um hábito por linha (desmarque Ativo para arquivar)
 *              Registros · um dia feito por linha
 *  Primeira vez: rode setup pelo editor e publique como app da Web.
 * ============================================================
 */

var APP = {
  nome: 'Hábitos Atômicos',
  fuso: 'America/Sao_Paulo',
  diasNaCorrente: 21, // quantos dias a corrente de cada hábito mostra
  maximoAtivos: 12
};

var COMO = ['completo', '2 minutos'];

var TABELAS = {
  habitos: {
    aba: 'Hábitos',
    colunas: {
      id: { titulo: 'ID', tipo: 'id' },
      nome: { titulo: 'Hábito', tipo: 'texto' },
      identidade: { titulo: 'Quem eu quero ser', tipo: 'texto' },
      minimo: { titulo: 'Versão de 2 minutos', tipo: 'texto' },
      deixa: { titulo: 'Quando e onde', tipo: 'texto' },
      recompensa: { titulo: 'O que torna bom', tipo: 'texto' },
      ativo: { titulo: 'Ativo', tipo: 'marcador' },
      criadoEm: { titulo: 'Criado em', tipo: 'dataHora', padrao: 'agora' }
    }
  },
  registros: {
    aba: 'Registros',
    colunas: {
      id: { titulo: 'ID', tipo: 'id' },
      habitoId: { titulo: 'ID do hábito', tipo: 'texto' },
      habito: { titulo: 'Hábito', tipo: 'texto' },
      data: { titulo: 'Data', tipo: 'data' },
      como: { titulo: 'Como', tipo: 'opcao', opcoes: COMO },
      criadoEm: { titulo: 'Registrado em', tipo: 'dataHora', padrao: 'agora' }
    }
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
  var dias = diasPorHabito_(lerLinhas_('registros'));
  var habitos = habitosAtivos_().map(function (h) { return resumoDoHabito_(h, dias[h.id] || {}, hoje); });
  return {
    nome: APP.nome,
    hoje: hoje,
    habitos: habitos,
    feitosHoje: habitos.filter(function (h) { return h.hoje; }).length,
    votos: habitos.reduce(function (soma, h) { return soma + h.votos; }, 0)
  };
}

/** Marca o hábito como feito hoje, completo ou na versão de 2 minutos. */
function marcar(habitoId, como) {
  exigirDono_();
  habitoId = id_(habitoId);
  como = opcao_(como, 'Como', COMO);
  var hoje = hojeISO_();
  comTrava_(function () {
    var habito = habitoAtivo_(habitoId);
    var registro = registroDoDia_(habitoId, hoje);
    if (!registro) {
      adicionarLinha_('registros', { habitoId: habitoId, habito: habito.nome, data: hoje, como: como });
    } else if (registro.como !== como) {
      atualizarLinha_('registros', registro.id, { como: como });
    }
  });
  return carregarTela();
}

/** Desfaz a marcação de hoje. */
function desmarcar(habitoId) {
  exigirDono_();
  habitoId = id_(habitoId);
  comTrava_(function () {
    var registro = registroDoDia_(habitoId, hojeISO_());
    if (registro) excluirLinha_('registros', registro.id);
  });
  return carregarTela();
}

/** Cria um hábito novo ou, com dados.id, edita um que já existe. */
function salvarHabito(dados) {
  exigirDono_();
  dados = objeto_(dados);
  var habito = {
    nome: texto_(dados.nome, 'Hábito', { max: 40 }),
    identidade: texto_(dados.identidade, 'Quem você quer ser', { max: 80 }),
    minimo: texto_(dados.minimo, 'Versão de 2 minutos', { max: 80 }),
    deixa: texto_(dados.deixa, 'Quando e onde', { max: 100 }),
    recompensa: texto_(dados.recompensa, 'O que torna bom', { max: 100, obrigatorio: false })
  };
  comTrava_(function () {
    if (dados.id) {
      var id = id_(dados.id);
      habitoAtivo_(id);
      atualizarLinha_('habitos', id, habito);
      return;
    }
    if (habitosAtivos_().length >= APP.maximoAtivos) {
      throw new Error('Comece com poucos hábitos: aqui o limite é ' + APP.maximoAtivos + ' ativos.');
    }
    habito.ativo = true;
    adicionarLinha_('habitos', habito);
  });
  return carregarTela();
}

/** Tira o hábito da tela. O histórico fica na planilha (marque Ativo de novo para voltar). */
function arquivarHabito(id) {
  exigirDono_();
  id = id_(id);
  comTrava_(function () {
    habitoAtivo_(id);
    atualizarLinha_('habitos', id, { ativo: false });
  });
  return carregarTela();
}

// ============================================================
// Regras do app (internas)
// ============================================================

function habitosAtivos_() {
  return lerLinhas_('habitos').filter(function (h) { return h.ativo && h.nome; });
}

function habitoAtivo_(id) {
  var habito = habitosAtivos_().filter(function (h) { return h.id === id; })[0];
  if (!habito) throw new Error('Esse hábito não está mais ativo. Atualize a tela.');
  return habito;
}

function registroDoDia_(habitoId, dia) {
  return lerLinhas_('registros').filter(function (r) { return r.habitoId === habitoId && r.data === dia; })[0] || null;
}

/** { idDoHábito: { 'aaaa-mm-dd': 'completo' ou '2 minutos' } } */
function diasPorHabito_(registros) {
  var mapa = {};
  registros.forEach(function (r) {
    if (!r.data || !r.habitoId) return;
    mapa[r.habitoId] = mapa[r.habitoId] || {};
    mapa[r.habitoId][r.data] = r.como === '2 minutos' ? '2 minutos' : 'completo';
  });
  return mapa;
}

/**
 * O que a tela mostra de um hábito. Os números saem daqui, e a tela só desenha:
 *   votos      dias feitos desde sempre (cada um é um voto para a identidade)
 *   sequencia  dias seguidos até hoje (ou até ontem, se hoje ainda não foi)
 *   faltas     dias seguidos sem fazer antes de hoje (0 quando hoje já foi)
 *   corrente   um item por dia: completo, 2 minutos, falhou, hoje ou antes (do início)
 */
function resumoDoHabito_(habito, dias, hoje) {
  var inicio = habito.criadoEm ? habito.criadoEm.slice(0, 10) : hoje;
  var ontem = somarDias_(hoje, -1);

  var sequencia = 0;
  for (var d = dias[hoje] ? hoje : ontem; dias[d]; d = somarDias_(d, -1)) sequencia++;

  var faltas = 0;
  if (!dias[hoje]) {
    for (var f = ontem; f >= inicio && !dias[f] && faltas < 99; f = somarDias_(f, -1)) faltas++;
  }

  var corrente = [];
  for (var i = APP.diasNaCorrente - 1; i >= 0; i--) {
    var dia = somarDias_(hoje, -i);
    if (dias[dia]) corrente.push(dias[dia]);
    else if (dia === hoje) corrente.push('hoje');
    else if (dia < inicio) corrente.push('antes');
    else corrente.push('falhou');
  }

  return {
    id: habito.id,
    nome: habito.nome,
    identidade: habito.identidade,
    minimo: habito.minimo,
    deixa: habito.deixa,
    recompensa: habito.recompensa,
    hoje: dias[hoje] || '',
    votos: Object.keys(dias).length,
    sequencia: sequencia,
    faltas: faltas,
    corrente: corrente
  };
}
