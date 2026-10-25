/**
 * ============================================================
 *  TAREFAS · skill "apps-na-planilha" · versão 2
 * ============================================================
 *  Arquivo fixo, só para apps com tarefas automáticas (APP.tarefas no
 *  arquivo App). Não edite. Ele fica separado do núcleo porque o Google
 *  pede a permissão "executar quando você não estiver presente" para
 *  qualquer projeto que tenha este código; app sem tarefas não precisa dela.
 * ============================================================
 */

/**
 * Liga as tarefas de APP.tarefas. Valores aceitos para cada função:
 *   um número de 0 a 23  roda todo dia nessa hora
 *   'formulario'         roda a cada resposta de um Google Forms ligado à planilha
 *   'edicao'             roda a cada edição, com as permissões do dono
 * Rode pelo editor depois do setup. Pode rodar de novo: refaz as tarefas sem duplicar.
 */
function instalarGatilhos() {
  exigirDono_();
  var tarefas = APP.tarefas || {};
  var nomes = Object.keys(tarefas);
  if (!nomes.length) return 'Este app não tem tarefas automáticas.';
  ScriptApp.getProjectTriggers().forEach(function (g) {
    if (tarefas.hasOwnProperty(g.getHandlerFunction())) ScriptApp.deleteTrigger(g);
  });
  nomes.forEach(function (nome) {
    var quando = tarefas[nome];
    if (typeof quando === 'number' && quando >= 0 && quando <= 23) {
      // O fuso vem do app: projeto novo nasce no fuso de Nova York.
      ScriptApp.newTrigger(nome).timeBased().everyDays(1).atHour(quando)
        .inTimezone(APP.fuso || Session.getScriptTimeZone()).create();
    } else if (quando === 'formulario') {
      ScriptApp.newTrigger(nome).forSpreadsheet(planilha_()).onFormSubmit().create();
    } else if (quando === 'edicao') {
      ScriptApp.newTrigger(nome).forSpreadsheet(planilha_()).onEdit().create();
    } else {
      throw new Error('Tarefa "' + nome + '" com horário inválido em APP.tarefas.');
    }
  });
  return 'Tarefas automáticas ligadas: ' + nomes.join(', ') + '.';
}
