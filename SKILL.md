---
name: apps-na-planilha
description: Cria pequenos apps pessoais ou para grupos pequenos com Google Planilhas e Apps Script (planilha com automações, formulário ou app da Web no celular), de graça, sem hospedagem e sem instalar nada, pensado para quem não programa. Escolhe o formato mais simples que resolve, envia e testa o código sozinho pelo clasp (ou guia clique a clique), entrega código seguro a partir de um núcleo fixo e testado e explica riscos de segurança e privacidade em linguagem simples. Use sempre que alguém quiser criar, publicar, corrigir ou melhorar um app simples para a própria vida, a família, amigos ou colegas (controle financeiro, gastos, hábitos, treinos, lista de compras, caderneta do pet, contas a pagar, bingo, bolão, votação, escala, lembretes) ou mencionar Apps Script, web app do Google, automatizar planilha, transformar planilha em app ou colocar um app pequeno no ar sem servidor, mesmo sem citar Apps Script. Também cobre análises de IA agendadas (Gemini, ChatGPT, Claude) sobre os dados.
license: MIT
compatibility: Funciona em agentes compatíveis com Agent Skills (Claude, Codex, opencode, Antigravity). Com terminal ou acesso ao computador da pessoa, o agente usa Node.js e clasp para enviar e testar o código sozinho; sem isso, o caminho de copiar e colar não exige nada instalado. Python 3 é opcional, para o verificador de segurança.
---

# Apps na planilha

Esta skill transforma uma ideia de app pequeno em algo funcionando na vida da pessoa em uma conversa. A planilha Google guarda os dados, o Apps Script roda as regras e as tarefas automáticas, e, quando faz sentido, um link vira um app no celular. Não tem servidor para alugar, domínio, cartão de crédito nem instalação.

Quem pede costuma ser técnico no sentido amplo (usa bem o computador, entende planilha) mas não programa. Seu trabalho é carregar a parte difícil: escolher o formato certo, entregar um código seguro, explicar só o necessário e deixar a pessoa capaz de manter o app sozinha.

## Como conversar

- **Linguagem do dia a dia.** Explique um termo técnico na primeira vez que ele aparecer ("implantar = publicar o app e gerar o link") e depois use o termo.
- **Um passo de cada vez na instalação.** Mande blocos curtos e espere a pessoa dizer que terminou, principalmente depois de autorizar e de publicar.
- **Não terceirize o trabalho técnico.** A pessoa não deve depurar o app, nem colar código se escolheu o clasp. Você envia o código e testa sozinho; a ela cabem só as decisões e o que exige a conta Google dela (login, autorização, chave de API).
- **Arquivos sempre inteiros**, se precisar cair no copiar e colar. Nunca "troque a linha 42": mande o arquivo completo e diga onde colar. Quem não programa não consegue fazer emenda com segurança.
- **Botões em negrito, como aparecem na tela**, e onde ficam ("o botão azul **Implantar**, no canto superior direito").
- **Nunca peça senha, chave de API ou token no chat.** Se o app precisar de uma chave, a pessoa cola em **Propriedades do script**, e você explica como.
- **Responda no idioma da pessoa.** A skill está em português porque nasceu para o público brasileiro.

## Dois caminhos de trabalho

- **Modo clasp (recomendado).** Possível sempre que você consegue rodar comandos no computador da pessoa, seja num agente com terminal (Claude Code, Codex, opencode, Antigravity e parecidos), seja num agente na nuvem ligado ao computador dela por pasta conectada e sessão remota. Você instala o que faltar, envia o código, testa e confere a planilha; ela só liga a API do Apps Script e faz login uma vez. Veja `references/modo-avancado-clasp.md`.
- **Navegador, copiando e colando.** Você escreve os arquivos e a pessoa cola no editor do Apps Script (`references/instalacao.md`). É o caminho quando a pessoa prefere assim, quando não há terminal nem acesso ao computador dela (por exemplo, um app de chat sem arquivos) ou quando o clasp não funciona ali.

**Pergunte no começo.** Na primeira mensagem de um app novo (ou na primeira vez que a pessoa usa a skill), dê uma introdução curta, de duas ou três frases: o app vai morar numa planilha Google, com o código no Apps Script, de graça e sem servidor. Em seguida pergunte qual caminho ela prefere, usando a ferramenta de pergunta com opções do ambiente em que você roda (no Claude Code, `AskUserQuestion`; sem ela, uma pergunta curta no chat):

- **clasp (recomendado):** eu envio, testo e publico o código pelo seu computador, com mais autonomia; você só instala/autoriza uma vez.
- **Navegador:** eu mando os arquivos e você cola no editor do Apps Script a cada mudança.

Se o ambiente não deixa rodar comandos no computador da pessoa, não ofereça o clasp: explique em uma frase por quê e siga pelo navegador. Guarde a escolha (no arquivo de instruções do projeto, se houver) e não pergunte de novo a cada mudança.

Se a conversa tiver os conectores do Google Planilhas ou Drive, use-os para conferir os dados gravados durante os testes e para criar a cópia de teste da planilha (sempre com a permissão da pessoa). O código do Apps Script não passa por eles.

## Testar antes de entregar

A pessoa não quer ser a testadora. Antes de dizer "está pronto" ou de pedir que ela teste algo, teste você mesmo, numa cópia de teste da planilha, com um navegador que você controla (perfil próprio, em que ela entra na conta Google uma vez), funções de teste e a página de **Execuções** do projeto. Confira a planilha depois de toda gravação. Detalhes em `references/modo-avancado-clasp.md`. Só peça a ela o que exige a conta dela, e diga exatamente o que fazer e o que deve aparecer.

## Fluxo

### 1. Entender a ideia

Pergunte só o que faltar, no máximo quatro perguntas de uma vez:

- O que o app resolve e qual o **momento de uso** ("lançar um gasto em 10 segundos no ônibus", "marcar a vacina do cachorro quando sair do veterinário").
- **Quem usa:** só a pessoa, a família, ou um grupo maior? Isso decide o formato e o desenho de segurança.
- **Que dados vai guardar**, e se algum é sensível (dinheiro, saúde, documentos, dados de outras pessoas).
- **Onde vai usar:** celular, computador ou os dois.

Se a pessoa já tem uma planilha com dados, o código entra nela: peça uma cópia de segurança antes (**Arquivo > Fazer uma cópia**). O `setup` não mexe em abas que já existem, e o núcleo acha as colunas pelo título, então basta descrever em `TABELAS` os títulos que a planilha já usa.

Se a pessoa traz um projeto de Apps Script que não foi feito com esta skill, não reescreva tudo de uma vez. Passe o verificador e o checklist de segurança, corrija o que for risco e, se ela quiser, migre aos poucos para a estrutura de núcleo + App.

### 2. Escolher o formato

Escolha o formato mais simples que resolve o momento de uso. Detalhes, exemplos e o caso do formulário em `references/formatos.md`.

| Formato | A pessoa usa | Quando |
|---|---|---|
| **Planilha + automações** | a própria planilha, no computador ou no app Planilhas | Lembrar, calcular ou organizar sozinho algo que ela já faria numa planilha |
| **Formulário + planilha** | um Google Forms para lançar, a planilha para ver | Lançar rápido pelo celular; ver o resumo de vez em quando basta |
| **App da Web** | um link que abre como app no celular | Lançar e ver na mesma tela, com cara de app, ou várias pessoas interagindo |

Nem tudo serve para Apps Script. Diga quando não serve e sugira outro caminho: app público ou para clientes, pagamentos, login de estranhos, dados sensíveis de terceiros, tempo real de verdade (chat, jogo de reflexo), muita gente ao mesmo tempo, quem não usa conta Google. Para montar um app clicando, sem código, existe o AppSheet.

### 3. Propor um plano curto e esperar o ok

Antes de escrever código, mostre em poucas linhas:

- **Formato** escolhido e por quê.
- **Abas da planilha** e colunas de cada uma.
- **Telas** (no app da Web) ou **o que acontece na planilha** (nos outros formatos).
- **Quem acessa** e por quê.
- **O que roda sozinho** (lembretes por e-mail, aviso a cada resposta), se houver (`references/automacoes.md`).
- **Riscos** em uma ou duas linhas, se o app tiver dado sensível ou for de grupo.

Espere a aprovação. Ajustar o plano custa uma mensagem; refazer o app custa a paciência da pessoa.

### 4. Escrever o código

O código tem uma parte fixa e testada, igual em todo app, e uma parte que você escreve. Leia `references/arquitetura.md` antes de escrever o primeiro App: ele descreve o contrato entre as partes e as funções que o núcleo oferece.

| Arquivo | O que é | Você |
|---|---|---|
| `assets/nucleo/Nucleo.gs` | Dados, segurança, validação, datas. Sempre presente | Copia igual |
| `assets/nucleo/Tarefas.gs` | Liga tarefas automáticas. Só em apps com `APP.tarefas` | Copia igual |
| `assets/nucleo/base.html` | Visual e ajudantes da tela. Só no app da Web | Copia igual |
| `App.gs` | Descreve o app (`APP`, `TABELAS`) e suas regras | Escreve, partindo de `assets/app-web/App.gs` ou `assets/planilha/App.gs` |
| `index.html` | A tela do app. Só no app da Web | Escreve, partindo de `assets/app-web/index.html` |

Para ver um app completo nessa estrutura, leia `assets/exemplos/habitos/`: um rastreador de hábitos com identidade, versão de 2 minutos, sequência e corrente de dias, em que o toque responde na hora.

Por que assim: a segurança (texto que nunca vira fórmula, conferência do dono, validação, uma gravação por vez) não depende de ser reescrita certo a cada app; a pessoa cola os arquivos fixos uma vez e, nas melhorias, só App e index mudam; e separar HTML, CSS e JavaScript em arquivos incluídos é a recomendação do próprio Google para o HTML Service.

Regras para o App e o index (detalhes em `references/arquitetura.md`):

- **Nunca edite os arquivos fixos para um app.** Se faltar algo, resolva no App ou no index.
- **Toda gravação passa pelo núcleo** (`adicionarLinha_`, `atualizarLinha_`, `excluirLinha_`). Gravação direta em célula só com número, data em série ou `celulaTexto_`.
- **Funções que a tela chama ficam sem `_`**, começam com `exigirDono_()` (ou com a conferência do participante, em app de grupo), validam cada parâmetro e devolvem só os campos que a tela usa. Todo o resto termina com `_`.
- **Os cálculos ficam no App** e a tela só mostra. Um número só para cada coisa, na tela, nos e-mails e para a IA.
- **Na tela, todo dado passa por `esc()`**, e ações que gravam usam `enquantoSalva`; ações que apagam usam `confirmarComSegundoToque`.
- **Todo erro aparece em destaque** com `avisar(texto, 'erro')`, nunca só num texto perto do botão, que pode ficar escondido atrás do rodapé ou fora da tela. Se o erro é num campo ou linha, role a tela até ele.
- **Permissões mínimas:** só use serviços do Google que o app precisa, e não os cite nem em comentários, porque o Google lê o código todo para decidir o que pedir.

**Design sem enrolação.** Apps feitos por IA tendem a encher a tela de números repetidos, textos longos e métricas que fazem sentido para a máquina, não para a pessoa. Evite isso de propósito:

- Cada informação aparece uma vez, no lugar onde ela é usada.
- Rótulos curtos, com as palavras que a pessoa usa ("Livre no mês", não "Saldo disponível projetado").
- Nada de número inventado ou valor de exemplo fixo na tela. Sem dados, a tela diz que está vazia.
- Métricas que ajudam em vez de punir: um limite diário fica vermelho no dia da compra grande do mês, enquanto o ritmo do mês (gasto até agora contra o esperado até hoje) conta a história certa.
- O momento de uso guia a tela inicial: a ação mais frequente fica a um toque.

**Antes de entregar:**

1. Se puder executar código, salve os arquivos do projeto numa pasta temporária e rode `python scripts/revisar_seguranca.py <pasta>` (o script fica na pasta desta skill). Ele confere se os arquivos fixos estão intactos. Corrija todo `[CORRIGIR]`, avalie cada `[CONFERIR]` e use os `[INFO]` para explicar as permissões. Sem execução de código, passe pelo checklist da seção 2 de `references/seguranca.md`.
2. Se puder executar Node, confira a sintaxe dos `.gs` (`node --check` numa cópia `.js`).
3. Atualize o comentário do topo do App: o que o app faz, formato, arquivos e abas. É ele que dá contexto quando a pessoa voltar numa conversa nova.

**Como entregar:** no modo clasp, você envia o código com `clasp push`, testa e só então avisa a pessoa. No copiar e colar, um bloco de código por arquivo, completo, com o nome do arquivo antes: na primeira vez, todos os arquivos do formato; nas melhorias, só os que mudaram. O `appsscript.json` só entra no modo clasp.

### 5. Instalar

No modo clasp, siga a preparação e o ciclo de `references/modo-avancado-clasp.md`. No copiar e colar, siga `references/instalacao.md`: colar o código (Parte 1), rodar o `setup` e autorizar (Parte 2) e a parte do formato (3A, 3B ou 3C). Nos dois, na tela "O Google não verificou este app", explique o que ela significa antes de a pessoa clicar (seção 5.1 de `references/seguranca.md`) e liste as permissões que vão aparecer, com o porquê de cada uma (seção 4).

**Autorizações:** o editor só pede as permissões que a função escolhida usa, e o link /dev nunca pede autorização nova. Quando o app ganhar um serviço novo (acessar a internet, enviar e-mail), crie uma função curta que use esse serviço e é ela que roda no editor para autorizar.

### 6. Entregar com os avisos de segurança

Quando o app estiver funcionando, feche com um resumo curto de segurança, de 4 a 7 pontos escolhidos para este app (seção 5.2 de `references/seguranca.md`): quem consegue abrir, o que fica fechado, verificação em duas etapas na conta Google, o que o app guarda, como desfazer estragos. Para app de grupo, inclua a seção 5.3. Sem sermão: são instruções práticas.

### 7. Evoluir o app

- Cada mudança: no modo clasp, `clasp pull`, editar, testar na cópia, enviar e conferir o **/dev** (ciclo em `references/modo-avancado-clasp.md`). No copiar e colar, só os arquivos que mudaram, inteiros, e a Parte 4 de `references/instalacao.md`.
- **Publicar** no link de sempre (**/exec**) só com a confirmação explícita da pessoa, pedida depois do teste. Nunca diga que publicou, nem que está publicando, antes de o comando terminar e a nova versão aparecer na implantação. Publicar mantém o link: nova versão na implantação que já existe.
- Em uma conversa nova, comece pelo código atual: `clasp pull` no modo clasp; no copiar e colar, peça para a pessoa colar o App (e o index). Nunca reescreva de memória. Os arquivos fixos você já tem.
- Quando um pedido aumentar o risco (abrir para outras pessoas, guardar dado sensível, conectar a um serviço externo, ligar uma IA), diga o que muda antes de fazer.
- Se o pedido couber num formato mais simples do que o atual, ou precisar de um mais completo, diga. A planilha continua a mesma quando o formato muda.

## Apps em grupo

Bingo, bolão, votação, escala. O app continua rodando com a conta do dono, mas gente de fora passa a chamar as funções. Leia `references/apps-em-grupo.md` antes de desenhar. O essencial: a planilha nunca é compartilhada; o servidor é o juiz; participantes se identificam por apelido e um código aleatório guardado no aparelho; ações de administrador continuam com `exigirDono_()`; limites de tamanho, quantidade e ritmo; uma forma de apagar os dados no fim. Se o grupo só precisa mandar informações, um formulário resolve.

## IA analisando os dados

Muita gente quer que uma IA comente os dados de tempos em tempos, por exemplo um comentário sobre os gastos a cada dois dias. Use `references/ia-agendada.md`. O padrão: a tarefa agendada do assistente lê a planilha (de preferência só lendo) e responde num formato curto e fixo; o app calcula os números e a IA só explica. Quando há cálculo de verdade, o app escreve os números oficiais numa aba Indicadores para a IA usar.

## Limites do Apps Script (conta Google pessoal)

| Limite | Valor |
|---|---|
| Tempo de uma execução | 6 minutos |
| Tempo total de tarefas automáticas por dia | 90 minutos |
| Gatilhos por pessoa, por projeto | 20 |
| Execuções simultâneas | 30 |
| E-mails enviados (destinatários por dia) | 100 |
| Chamadas a sites externos por dia | 20.000 |
| Células por planilha | 10 milhões |

Na prática: o app da Web leva de 1 a 3 segundos para responder, então devolva para a tela só o que ela mostra (os registros recentes, não a planilha toda). O núcleo já lê e grava em bloco.

## Arquivos da skill

| Arquivo | Quando ler |
|---|---|
| `references/formatos.md` | Ao escolher o formato; tem o passo a passo do formulário |
| `references/arquitetura.md` | Antes de escrever o primeiro App: estrutura, `TABELAS` e funções do núcleo |
| `assets/nucleo/` | Arquivos fixos: copie iguais |
| `assets/app-web/`, `assets/planilha/` | Pontos de partida do App (e do index) |
| `assets/exemplos/habitos/` | Exemplo completo de app da Web: toque com resposta imediata, sequências, formulário guiado |
| `references/instalacao.md` | No copiar e colar, e quando algo dá errado (tabela de erros) |
| `references/seguranca.md` | Antes de entregar código, na tela de autorização e no resumo final |
| `references/automacoes.md` | Lembretes por e-mail, avisos e tarefas que rodam sozinhas |
| `references/apps-em-grupo.md` | Quando várias pessoas usam o mesmo app da Web |
| `references/ia-agendada.md` | Quando a pessoa quer IA analisando os dados |
| `references/modo-avancado-clasp.md` | Sempre que der para rodar comandos no computador da pessoa: preparação, testes, autorizações e publicação |
| `scripts/revisar_seguranca.py` | Antes de cada entrega, quando der para executar Python |
