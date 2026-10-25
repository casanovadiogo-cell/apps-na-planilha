# Escolher o formato do app

Antes de escrever código, escolha o formato mais simples que resolve o momento de uso da pessoa. Cada degrau a mais traz mais arquivos, mais passos de instalação e mais cuidado com segurança. App da Web com tela própria é o formato mais poderoso e também o mais pesado; muita ideia boa não precisa dele.

| | Planilha + automações | Formulário + planilha | App da Web |
|---|---|---|---|
| A pessoa usa | a própria planilha (computador ou app Planilhas no celular) | um Google Forms para lançar; a planilha para ver | um link que abre como app no celular |
| Bom para | lembretes, listas, controles que a pessoa já faz em planilha | lançar rápido pelo celular, check-in, inscrições, registros | lançar e ver na mesma tela, painéis, apps de grupo interativos |
| Exemplos | caderneta do pet, contas a pagar, manutenção do carro, estoque da despensa | gastos do dia a dia, treinos, presença em evento | controle financeiro com painel, bingo, votação ao vivo |
| Arquivos de código | Nucleo + App | nenhum, ou Nucleo + Tarefas + App | Nucleo + App + base + index |
| Publicar link | não | só o do formulário | sim |
| Modelo pronto | `assets/planilha/` | trecho abaixo | `assets/app-web/` |

Em qualquer formato, app com tarefas automáticas (lembretes, avisos) leva também o arquivo fixo Tarefas.

Regra prática:

- Se a pessoa topa usar a planilha e o que falta é lembrar, calcular ou organizar sozinho: **planilha + automações**.
- Se o problema é lançar dados rápido pelo celular, e ver o resumo de vez em quando basta: **formulário + planilha**.
- Se lançar e ver precisam estar juntos, com cara de app, ou várias pessoas interagem ao mesmo tempo: **app da Web**.

Na dúvida, comece pelo formato mais simples. Dá para subir de degrau depois sem perder os dados: a planilha continua a mesma.

## Planilha + automações

A planilha é a tela. O Apps Script faz o que fórmula não faz: mandar e-mail, rodar todo dia, reagir quando a pessoa marca uma caixa.

- **Estrutura boa de planilha primeiro:** uma aba por assunto, títulos na linha 1, uma linha por item. Listas suspensas (tipo `opcao`) e caixas de seleção (tipo `marcador`) evitam erro de digitação e funcionam no celular; o `setup` já cria as duas a partir de `TABELAS`.
- **Botão no celular é caixa de seleção.** Menus personalizados e desenhos com script só funcionam no computador. No app Planilhas do celular, o que funciona é marcar uma caixa e deixar um gatilho de edição (`onEdit`) reagir, como o "Fiz hoje" do modelo. Peça para a pessoa testar no celular dela.
- **`onEdit` simples não pede permissão** e pode mexer na própria planilha. Ele não consegue mandar e-mail; para isso, use uma tarefa (`APP.tarefas`, ver `automacoes.md`).
- **Planilha compartilhada:** quem pode editar a planilha também edita o código e vê tudo. Para a família ou uma república, tudo bem se todos são de confiança; avise que uma tarefa automática roda com a conta de quem a instalou. Se for gente de fora do círculo de confiança, mude de formato (formulário ou app da Web).

## Formulário + planilha

O Google Forms cuida da entrada: funciona bem no celular, valida as respostas e não precisa de código. As respostas caem numa aba da planilha. O resumo pode ser feito com fórmulas, e o Apps Script só entra se precisar reagir a cada resposta.

**Montar (sem código):**

1. Crie o formulário em **forms.new**. Para valores em dinheiro, use resposta curta com **Validação de resposta > Número**. Para categorias, múltipla escolha ou lista suspensa.
2. Na aba **Respostas** do formulário, clique em **Vincular às Planilhas** e escolha a planilha do app (ou crie uma nova). Aparece a aba **Respostas ao formulário 1**, com o **Carimbo de data/hora** na primeira coluna.
3. Resumo com fórmula numa aba à parte. Total do mês atual, se o valor estiver na coluna B (separador `;` na planilha em português):
   `=SOMASES('Respostas ao formulário 1'!B:B; 'Respostas ao formulário 1'!A:A; ">="&FIMMÊS(HOJE();-1)+1; 'Respostas ao formulário 1'!A:A; "<"&FIMMÊS(HOJE();0)+1)`
4. Para lançar com um toque, a pessoa abre o link do formulário no celular e usa **Adicionar à tela inicial**.

**Com código (opcional):** quando cada resposta precisa disparar algo, como um aviso ao passar da meta. A aba de respostas é criada pelo Forms, então ela entra em `TABELAS` com `externa: true` (o `setup` não cria) e com os títulos iguais aos das perguntas. A ordem não importa: o núcleo acha as colunas pelo título.

```javascript
var APP = {
  nome: 'Gastos',
  fuso: 'America/Sao_Paulo',
  metaDoMes: 1500,
  tarefas: { aoResponder: 'formulario' } // roda a cada resposta do formulário
};

var TABELAS = {
  respostas: {
    aba: 'Respostas ao formulário 1',
    externa: true, // quem cria esta aba é o Google Forms
    colunas: {
      quando: { titulo: 'Carimbo de data/hora', tipo: 'dataHora' },
      valor: { titulo: 'Valor', tipo: 'dinheiro' },
      categoria: { titulo: 'Categoria', tipo: 'texto' }
    }
  }
};

/** Roda a cada resposta. Avisa uma vez por mês quando os gastos passam da meta. */
function aoResponder() {
  var mes = hojeISO_().slice(0, 7);
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('metaAvisada') === mes) return;
  var total = lerLinhas_('respostas')
    .filter(function (r) { return r.quando.slice(0, 7) === mes; })
    .reduce(function (soma, r) { return soma + (r.valor || 0); }, 0);
  if (total <= APP.metaDoMes) return;
  props.setProperty('metaAvisada', mes);
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: APP.nome + ': o mês passou da meta',
    body: 'Gastos do mês: R$ ' + total.toFixed(2).replace('.', ',') + '. Meta: R$ ' + APP.metaDoMes.toFixed(2).replace('.', ',') + '.'
  });
}
```

**Segurança do formulário:** o link é difícil de adivinhar, mas qualquer pessoa que tiver o link consegue mandar respostas. Para exigir login com conta Google, em **Configurações > Respostas** ative a coleta de e-mails no modo verificado; isso também grava o e-mail de quem responde, então avise as pessoas num formulário de grupo. Respostas são dados de fora: trate como entrada não confiável ao processar.

## App da Web

Tela própria servida pelo Apps Script, aberta por um link. É o formato do modelo `assets/app-web/`, com a estrutura descrita em `arquitetura.md`. Use quando a experiência de app faz diferença no uso diário ou quando várias pessoas interagem (ver `apps-em-grupo.md`).

## Quando sair do Apps Script

- **AppSheet** (criador de apps sem código do Google, a partir de uma planilha): quando a pessoa prefere montar o app clicando e o app é basicamente formulários e listas. Você pode guiar, mas não escreve o app como código.
- **Looker Studio:** painéis bonitos e só de leitura em cima da planilha.
- **Hospedagem de verdade:** app público, para clientes, com pagamento ou muitos usuários ao mesmo tempo.
