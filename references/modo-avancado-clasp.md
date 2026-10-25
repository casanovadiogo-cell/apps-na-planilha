# Modo avançado: Claude edita, publica e testa sozinho (clasp)

Para quando a conversa acontece num ambiente com terminal (Claude Code, ou o app Claude para computador com acesso a pastas) e a pessoa quer parar de copiar e colar. Você passa a editar os arquivos, enviar o código, testar o link e conferir a planilha. Custa uma preparação de uns 15 minutos e a instalação do Node.js, então ofereça quando o app vai ter muitas rodadas de ajuste, não na primeira conversa.

## Preparação (uma vez por computador)

1. **Ferramentas.** Confira `node --version`, `npm --version` e `git --version`. Se faltar o Node.js, peça permissão e instale a versão LTS (Windows: `winget install OpenJS.NodeJS.LTS`; Mac: o instalador de nodejs.org ou `brew install node`).
2. **clasp**, a ferramenta oficial do Google para Apps Script: `npm install -g @google/clasp`.
3. **API do Apps Script.** Só a pessoa pode ligar: https://script.google.com/home/usersettings > **API Google Apps Script** > ativada.
4. **Login.** A pessoa roda `clasp login` no terminal e autoriza no navegador que abrir. Você nunca digita senha nem pede que ela cole códigos no chat.

## Projeto

- Pasta própria, com git, e o código em `src/`.
- **Projeto que já existe:** a pessoa copia o **ID do script** em **Configurações do projeto** no editor. Depois: `clasp clone <ID do script> --rootDir src`.
- **Projeto novo:** `clasp create --type sheets --title "Nome do app" --rootDir src` cria a planilha e o script ligado a ela. Copie para `src/` o `assets/nucleo/Nucleo.gs` e o `App.gs` do formato escolhido (`assets/app-web/` ou `assets/planilha/`); com tarefas automáticas, também `assets/nucleo/Tarefas.gs`; no app da Web, também `assets/nucleo/base.html`, o `index.html` e o `appsscript.json`. Os `.gs` podem virar `.js`, o clasp converte. Apague o `Code.js` vazio que o `clasp create` deixa.
- **Os arquivos fixos continuam fixos** neste modo (Nucleo, Tarefas, base): edite só App e index. Com o código no computador, rode `scripts/revisar_seguranca.py src` antes de cada `clasp push`.
- Um `CLAUDE.md` na pasta com: o que o app faz, o fluxo abaixo e os links do projeto (ID do script, planilha, link /exec, ID da implantação). Esses links não são senhas, mas não devem ir para repositório público.
- `.gitignore` com `node_modules/`, `.clasprc.json` e `.env`.

## O ciclo de cada mudança

1. Editar os arquivos em `src/`.
2. Testar o que der localmente (sintaxe com `node --check`, regras de cálculo com dados de exemplo).
3. `clasp push` envia o código. Se a pessoa também mexe pelo editor do navegador, rode `clasp pull` antes, senão o push apaga as mudanças dela.
4. Abrir o link **/dev** no navegador (ele sempre roda o último código enviado). Na primeira vez, a pessoa entra na conta Google no navegador que você usa.
5. Conferir na planilha o que foi gravado, pelo conector do Google Planilhas se houver, com a permissão da pessoa.
6. Publicar no link de sempre: `clasp deploy -i <ID da implantação> -d "o que mudou"`. Sem o `-i`, o clasp cria uma implantação nova, com link novo. `clasp list-deployments` mostra os IDs.
7. Commit no git.

## Segurança deste modo

- O `clasp login` guarda um token da conta Google da pessoa em `~/.clasprc.json`. Nunca mostre o conteúdo desse arquivo, nunca faça commit dele. Em computador compartilhado, `clasp logout` ao terminar.
- `clasp push --force` sobrescreve o código online sem perguntar. Prefira `clasp push` normal e só force quando souber que nada foi editado no navegador.
- Publicar (`clasp deploy`) muda o app que a pessoa usa no dia a dia. Peça o ok antes, depois de testar no /dev.
- O código não deve ter IDs nem dados pessoais fixos, então a pasta pode virar repositório no GitHub. Mesmo assim, confira o `CLAUDE.md` e o histórico antes de tornar qualquer repositório público.
