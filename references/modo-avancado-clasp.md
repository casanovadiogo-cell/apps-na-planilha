# Modo clasp: o agente edita, envia, testa e publica

É o caminho recomendado sempre que você consegue rodar comandos no computador da pessoa: um agente com terminal local (Claude Code, Codex, opencode, Antigravity e parecidos) ou um agente na nuvem ligado ao computador dela por uma pasta conectada e uma sessão remota. Você edita os arquivos, envia o código, testa e confere a planilha. A pessoa só faz o que exige a conta Google dela: ligar a API, fazer login uma vez e aprovar autorizações.

Quem pede um app pela skill normalmente não programa. Colar arquivos no editor e testar cada ajuste é o que costuma cansar essa pessoa. Por isso, na primeira conversa, apresente este modo como o recomendado na pergunta sobre o caminho de trabalho (seção "Dois caminhos de trabalho" do `SKILL.md`).

## Preparação (uma vez por computador)

Faça você mesmo, pedindo permissão para instalar. A pessoa não precisa abrir terminal.

1. **Onde rodar.** Agente local: o terminal da própria conversa. Agente na nuvem: peça a conexão com o computador da pessoa (uma pasta do projeto e uma sessão remota que roda comandos lá). O clasp precisa rodar no computador dela, porque o login fica guardado lá.
2. **Ferramentas.** Confira `node --version`, `npm --version` e `git --version`. Se faltar o Node.js, instale a versão LTS (Windows: `winget install OpenJS.NodeJS.LTS`; Mac: o instalador de nodejs.org ou `brew install node`).
3. **clasp**, a ferramenta oficial do Google para Apps Script: `npm install -g @google/clasp`.
4. **API do Apps Script.** Só a pessoa pode ligar: https://script.google.com/home/usersettings > **API Google Apps Script** > ativada. Se ela disser que já está ligada, acredite e siga; se o clasp reclamar, aí volte ao assunto.
5. **Login.** Rode `clasp login`; abre o navegador e a pessoa só escolhe a conta e clica em **Permitir**. Avise antes o que vai aparecer. Nunca peça senha nem códigos no chat.

## Projeto

- Pasta própria, com git, e o código em `src/`.
- **Projeto que já existe:** pegue o **ID do script** no link do editor que a pessoa mandar (`script.google.com/.../projects/<ID>/edit`) ou em **Configurações do projeto**. Depois: `clasp clone <ID do script> --rootDir src` e um commit "estado atual do editor" antes de mudar qualquer coisa.
- **Projeto novo:** `clasp create --type sheets --title "Nome do app" --rootDir src` (no clasp 3, também `clasp create-script`) cria a planilha e o script ligado a ela, e baixa para `src/` um `appsscript.json` padrão, no fuso de Nova York. **Depois** do create, copie para `src/` o `assets/nucleo/Nucleo.gs` e o `App.gs` do formato escolhido (`assets/app-web/` ou `assets/planilha/`); com tarefas automáticas, também `assets/nucleo/Tarefas.gs`; no app da Web, também `assets/nucleo/base.html`, o `index.html` e o `appsscript.json` do modelo, por cima do padrão. Os `.gs` podem virar `.js`, o clasp converte. Se aparecer um `Code.js` vazio, apague.
- **A planilha criada pelo clasp nasce em inglês e no fuso GMT.** O `setup` do núcleo acerta fuso e idioma quando a planilha é nova; numa planilha antiga, confira em **Arquivo > Configurações**.
- **Os arquivos fixos continuam fixos** neste modo (Nucleo, Tarefas, base): edite só App e index (e arquivos novos do app). Rode `scripts/revisar_seguranca.py src` antes de cada `clasp push`.
- Um arquivo de instruções do projeto na pasta (`CLAUDE.md` no Claude Code, `AGENTS.md` no Codex e no opencode) com: o que o app faz, o fluxo abaixo e os links do projeto (ID do script, planilha, cópia de teste, link /exec, ID da implantação). Esses links não são senhas, mas não devem ir para repositório público.
- `.gitignore` com `node_modules/`, `.clasprc.json` e `.env`.

## Testar sozinho antes de pedir algo à pessoa

A pessoa não quer depurar o app. Antes de dizer "pronto, pode testar", você testa. Prepare isto na primeira rodada:

- **Cópia de teste da planilha.** **Arquivo > Fazer uma cópia** (pelo conector do Drive, se houver, ou pelo navegador) gera uma planilha com script próprio. Clone esse script numa segunda pasta e envie para lá primeiro. Os testes que gravam dados vão para a cópia, nunca para os dados de verdade. Depois de passar, envie para o projeto real.
- **Navegador que você controla**, com um perfil só seu (Chrome com `--user-data-dir` próprio, Playwright com contexto persistente, a extensão de navegador do agente ou o controle do computador, o que estiver disponível). A pessoa entra na conta Google nele uma vez; daí em diante você abre o /dev, sobe arquivos, clica nos botões, roda funções no editor e lê os erros. Use um perfil com uma conta só, senão o app da Web dá erro.
- **Funções de teste no código** (terminam com `_` se forem internas; sem `_` só as que precisam aparecer no editor), que rodam o caminho principal com dados de exemplo e registram o resultado com `Logger.log`. `clasp run` executa funções do terminal, mas exige o script ligado a um projeto do Google Cloud próprio; se isso não estiver pronto, rode a função pelo editor no seu navegador.
- **Conferir a planilha** depois de cada gravação: pelo conector do Google Planilhas, pelo navegador ou por uma função de teste que lê as últimas linhas.
- **Execuções:** `https://script.google.com/home/projects/<ID do script>/executions` mostra erros e tempos de cada chamada. Olhe ali antes de perguntar à pessoa o que apareceu.

Só peça à pessoa o que exige a conta dela (login, autorização, chave de API) ou uma decisão. Se algo só pode ser testado com ela, diga exatamente o que fazer e o que você espera ver.

## O ciclo de cada mudança

1. Se a pessoa pode ter mexido pelo editor do navegador, `clasp pull` antes, senão o push apaga as mudanças dela.
2. Editar os arquivos em `src/`.
3. Testar o que der localmente (sintaxe com `node --check` numa cópia `.js`, o JavaScript da página extraído para um `.js`, regras de cálculo com dados de exemplo) e rodar o verificador de segurança.
4. `clasp push` (sem `--force`) para a cópia de teste; testar lá pelo /dev e pelas funções de teste; conferir a planilha de teste.
5. `clasp push` para o projeto real e conferir o /dev dele (o /dev sempre roda o último código enviado e só quem edita o projeto abre).
6. Avisar a pessoa que está pronto e pedir a confirmação para publicar.
7. Só com a confirmação explícita: `clasp update-deployment <ID da implantação> -d "o que mudou"` (ou `clasp deploy -i <ID> -d "..."`). Sem o ID, o clasp cria uma implantação nova, com link novo. A primeira é `clasp create-deployment -d "versão 1"`, que usa o acesso do `appsscript.json`. `clasp list-deployments` mostra os IDs; confira depois que a implantação aponta para a versão nova.
8. Commit no git.

## Autorizações (onde mais se perde tempo)

- **O editor só pede as permissões que a função escolhida usa.** Rodar `setup` ou uma função que só lê a planilha não pede "conectar-se a um serviço externo". Quando o app ganha um serviço novo (UrlFetchApp, MailApp, gatilhos), crie uma função curta que use exatamente esse serviço (por exemplo, uma função que faz uma chamada de verdade ao site externo, ou que envia um e-mail para a própria pessoa) e peça para a pessoa rodar essa função no editor, ou rode você no seu navegador com a conta dela.
- **O link /dev não dispara autorização nova.** Ele só mostra o erro "You do not have permission to call ...". A autorização sai pelo editor, como acima.
- **O "link" que aparece no erro de permissão** (`https://www.googleapis.com/auth/...`) é só o nome da permissão. Abrir dá um erro do Google que não significa nada.
- O Google descobre os escopos sozinho lendo o código. Só mexa em `oauthScopes` no `appsscript.json` se o manifesto já listar escopos à mão.

## Publicação

- Publicar (`clasp deploy`/`update-deployment`) muda o app que a pessoa usa no dia a dia. Só com confirmação explícita dela na conversa, depois do teste no /dev. Um "funcionou" ou "fechou" sobre o teste não é ok para publicar: pergunte.
- Nunca diga que publicou, nem "já estou publicando", antes de o comando terminar e `clasp list-deployments` confirmar a versão nova. Se escreveu errado, corrija na hora.
- Ao publicar, diga o número da versão e que dá para voltar à anterior.

## Segurança deste modo

- O `clasp login` guarda um token da conta Google da pessoa em `~/.clasprc.json`. Nunca mostre o conteúdo desse arquivo, nunca faça commit dele. Em computador compartilhado, `clasp logout` ao terminar.
- O perfil do navegador de teste também guarda a sessão da conta Google. Deixe-o numa pasta fora do repositório e diga à pessoa onde está, para ela apagar quando quiser.
- `clasp push --force` sobrescreve o código online sem perguntar. Prefira `clasp push` normal e só force quando souber que nada foi editado no navegador.
- Chaves de API ficam em **Propriedades do script**, coladas pela pessoa. Nunca leia, registre ou mostre a chave, nem em log de teste.
- O código não deve ter IDs nem dados pessoais fixos, então a pasta pode virar repositório no GitHub. Mesmo assim, confira o `CLAUDE.md` e o histórico antes de tornar qualquer repositório público.

## Quando copiar e colar

Quando a pessoa escolheu o navegador, quando a conversa não tem terminal nem acesso ao computador dela, ou quando o clasp não funciona ali por um motivo que você não consegue resolver (diga o motivo). Siga `references/instalacao.md`. Se ela mudar de ideia ou o acesso aparecer depois, ofereça migrar para este modo.
