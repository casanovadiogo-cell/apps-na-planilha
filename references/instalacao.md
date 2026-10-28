# Instalação passo a passo (sem instalar nada no computador)

Caminho do navegador, copiando e colando: quando a pessoa escolheu esse caminho ou quando você não consegue rodar comandos no computador dela. No modo clasp, use `references/modo-avancado-clasp.md` em vez deste guia; a tabela de erros da Parte 5 vale para os dois.

Guia para conduzir a pessoa do zero até o app funcionando. Mande em blocos curtos e espere ela dizer que terminou antes de seguir, principalmente depois de autorizar e de publicar. Os nomes dos botões estão como aparecem no Google em português; podem mudar um pouco com o tempo, então diga também onde o botão fica.

Se a conta Google da pessoa estiver em inglês, o editor aparece em inglês: **Executar** = Run, **Implantar** = Deploy, **Revisar permissões** = Review permissions, **Avançado** = Advanced, **Acessar ... (não seguro)** = Go to ... (unsafe), **Permitir** = Allow, **Gerenciar implantações** = Manage deployments.

Precisa de uma conta Google e de um computador com navegador. O celular entra no fim.

**Qual conta usar:** para app pessoal, a conta Google pessoal (gmail). Conta do trabalho (Google Workspace) pode ter o Apps Script bloqueado pelo administrador, e dado pessoal não deve morar na conta da empresa.

**Formulário sem código?** Se o plano é só formulário + planilha com fórmulas, pule direto para a Parte 3B.

## Parte 1. Colar o código

1. Digite **sheets.new** na barra de endereço do navegador e aperte Enter para criar uma planilha em branco. Se for usar uma planilha que já existe, faça antes uma cópia de segurança (**Arquivo > Fazer uma cópia**).
2. Clique em **Planilha sem título**, no canto superior esquerdo, e dê o nome do app.
3. No menu, clique em **Extensões > Apps Script**. O editor de código abre numa aba nova. Clique em **Projeto sem título**, no topo, e dê o mesmo nome.
4. Na lista de arquivos à esquerda existe um arquivo chamado **Código.gs**. Passe o mouse sobre ele, clique nos três pontinhos e em **Renomear**, e digite **Nucleo**. Depois clique dentro do código, aperte **Ctrl+A** (no Mac, **Cmd+A**), apague e cole o **Nucleo.gs** que eu te passei.
5. Clique no **+** ao lado de **Arquivos**, escolha **Script**, digite **App** e aperte Enter. Apague o que vier pronto e cole o **App.gs**.
6. **Só se o app tem tarefas automáticas** (lembretes, avisos): crie do mesmo jeito o script **Tarefas** e cole o **Tarefas.gs**.
7. **Só no app da Web:** clique no **+**, escolha **HTML** e crie o arquivo **base**; cole a **base.html**. Repita para o arquivo **index** e cole o **index.html**. Digite os nomes sem ".html", o editor completa.
8. Salve com **Ctrl+S** (ou o ícone de disquete).

## Parte 2. Preparar a planilha e autorizar

9. Na lista de arquivos à esquerda, clique em **Nucleo**. No topo do editor, ao lado dos botões **Executar** e **Depurar**, tem uma lista com nomes de funções: ela mostra só as funções do arquivo aberto, por isso o Nucleo precisa estar aberto. Escolha **setup** e clique em **Executar**.
10. Aparece **Autorização necessária**. Clique em **Revisar permissões** e escolha a sua conta.
11. Aparece a tela **O Google não verificou este app**. Isso é esperado: explique antes de a pessoa clicar (texto pronto em `seguranca.md`, seção 5.1). Clique em **Avançado** e depois em **Acessar [nome do projeto] (não seguro)**.
12. Leia a lista de permissões com a pessoa. Se aparecerem caixas de seleção, marque todas: sem elas o app dá erro. Clique em **Permitir**.
13. Embaixo do código aparece o **Registro de execução**, terminando em **Execução concluída**. Volte para a aba da planilha: as abas do app foram criadas.
14. **Se o app tem tarefas automáticas** (lembretes, avisos, `APP.tarefas`): clique no arquivo **Tarefas**, escolha **instalarGatilhos** na lista e clique em **Executar**. O Google pede as permissões novas (por exemplo, enviar e-mail e rodar quando você não estiver presente); explique cada uma antes. Para conferir, abra **Acionadores** (ícone de relógio, no menu à esquerda do editor).

## Parte 3A. Planilha + automações: usar

- No computador, é só usar a planilha. No celular, instale o app **Planilhas Google** e abra a planilha por ele.
- Teste o que o app faz sozinho. No modelo da caderneta: marque **Fiz hoje** numa linha (também pelo celular) e veja a data mudar.
- Lembretes por e-mail chegam no horário da tarefa. Para testar na hora, rode a função do lembrete (ex.: **enviarLembretes**) pelo editor.

## Parte 3B. Formulário + planilha: ligar o formulário

1. Crie o formulário em **forms.new**, com as perguntas combinadas no plano.
2. Na aba **Respostas** do formulário, clique em **Vincular às Planilhas**, escolha **Selecionar planilha existente** e aponte a planilha do app. Aparece a aba **Respostas ao formulário 1**.
3. Se o app tem código com tarefa de formulário: só agora rode **instalarGatilhos** (Parte 2, passo 14).
4. Mande uma resposta de teste e confira a planilha.
5. No celular, abra o link do formulário e use **Adicionar à tela inicial** (Android: menu de três pontinhos do Chrome; iPhone: botão de compartilhar do Safari).

## Parte 3C. App da Web: publicar e abrir no celular

1. No editor, clique no botão azul **Implantar**, no canto superior direito, e depois em **Nova implantação**.
2. Clique na engrenagem ao lado de **Selecionar tipo** e escolha **App da Web**.
3. Preencha:
   - **Descrição:** versão 1
   - **Executar como:** Eu (o seu e-mail)
   - **Quem pode acessar:** Somente eu. Em app de grupo, use o que o plano definiu (ver `apps-em-grupo.md`).
4. Clique em **Implantar**. Se pedir autorização de novo, repita os passos 10 a 12.
5. Copie o **URL do app da Web**, que termina em **/exec**. Esse é o link do app.
6. Mande o link para você mesmo (por e-mail, ou na conversa "Mensagem para mim" do WhatsApp) e abra no celular, num navegador conectado com a mesma conta Google.
7. Para virar um ícone na tela: **Android (Chrome):** menu de três pontinhos > **Adicionar à tela inicial**. **iPhone (Safari):** botão de compartilhar > **Adicionar à Tela de Início**.

## Parte 4. Atualizar o app

Sempre que eu mandar uma versão nova:

1. Cole por cima, inteiro, só o arquivo que mudou (normalmente **App**, e **index** no app da Web) e salve. **Nucleo**, **Tarefas** e **base** só mudam quando eu disser que saiu versão nova deles.
2. Se a mudança pede permissão nova (enviar e-mail, rodar sozinho, acessar a internet), rode pelo editor uma função que use esse serviço: o editor só pede as permissões que a função escolhida usa, então **setup** pode não pedir a nova. Eu indico qual função rodar. O link **/dev** não pede autorização nova. Se mudou alguma tarefa automática, rode **instalarGatilhos** de novo.
3. **No app da Web, para testar antes:** **Implantar > Testar implantações** e copie o link que termina em **/dev**. Ele roda sempre o último código salvo e só quem edita o projeto consegue abrir.
4. **No app da Web, para publicar:** **Implantar > Gerenciar implantações**, selecione a implantação que já existe, clique no lápis (**Editar**), em **Versão** escolha **Nova versão** e clique em **Implantar**. O link **/exec** continua o mesmo. Cuidado: **Nova implantação** cria um link novo; use só na primeira vez.

Planilha + automações e formulário não têm o passo de publicar: salvou, valeu.

## Parte 5. Quando algo dá errado

| O que aparece | O que fazer |
|---|---|
| "Desculpe, não foi possível abrir o arquivo no momento", página em branco ou erro 400 no app da Web | O navegador está conectado em mais de uma conta Google. Abra o link numa janela anônima e entre só na conta dona do app, ou use um perfil do navegador só com essa conta. |
| A lista de funções não mostra **setup** | A lista mostra só as funções do arquivo aberto: clique no arquivo **Nucleo** (para **instalarGatilhos**, no **Tarefas**). Se ainda não aparecer, salve com Ctrl+S e confira se o arquivo foi colado inteiro. |
| "A aba X não tem a coluna Y" | Um título da linha 1 foi renomeado ou apagado. Volte o título ao nome original (pode mudar a posição da coluna à vontade). |
| "A planilha ainda não foi preparada" | Rode **setup** pelo editor (Parte 2). |
| "A aba Respostas ao formulário 1 não existe" | Ligue o formulário à planilha (Parte 3B). |
| "Acesso não autorizado" | Abra o app com a mesma conta que publicou. |
| "Você não tem permissão" ou "You do not have permission to call ..." | Falta autorizar um serviço. No editor, rode uma função que use esse serviço (para UrlFetchApp, uma função que chame a API; para e-mail, uma que envie) e aceite. Rodar uma função que não usa o serviço não pede nada. O link que aparece no erro é só o nome da permissão; não precisa abrir. |
| Mudei o código e o app da Web continua igual | Faltou publicar a nova versão (Parte 4). Para testar sem publicar, use o link **/dev**. |
| O lembrete não chegou | Confira **Acionadores** no editor. Se a tarefa não está lá, rode **instalarGatilhos**. Quando uma tarefa falha, o Google manda um e-mail com o erro. |
| Datas um dia antes ou depois | No editor, **Configurações do projeto** (engrenagem) > fuso horário. Na planilha, **Arquivo > Configurações** > fuso horário. Os dois no horário de Brasília (GMT-03:00, São Paulo). |
| Faixa "Este aplicativo foi criado por um usuário do Google Apps Script" no topo | Normal em todo app da Web feito no Apps Script, até para quem o criou. É o Google avisando que o app não é dele. Dá para fechar no X. |
| Qualquer outro erro | No editor, abra **Execuções** (menu à esquerda), copie a mensagem de erro e me mande. Tire nomes, valores e e-mails antes de colar. |

## Parte 6. Cópia e backup

- **Arquivo > Fazer uma cópia** copia a planilha junto com o código. Na cópia, rode **setup** de novo, depois **instalarGatilhos** se houver tarefas e, no app da Web, crie uma **Nova implantação** (a cópia tem link próprio).
- **Arquivo > Histórico de versões** volta a planilha para um ponto anterior. Útil se algo for apagado sem querer.
- Antes de uma mudança grande, faça uma cópia da planilha.
