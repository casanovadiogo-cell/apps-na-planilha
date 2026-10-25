# Arquitetura do código

Sumário: 1. Por que essa estrutura · 2. Os arquivos · 3. O arquivo App: APP e TABELAS · 4. O que o núcleo oferece · 5. A tela (base e index) · 6. Regras para escrever o App

## 1. Por que essa estrutura

Todo projeto de Apps Script é feito de arquivos `.gs` (código que roda no Google) e `.html` (tela), e os `.gs` compartilham um mesmo espaço: uma função de um arquivo enxerga as do outro. Essa é a regra da plataforma. A escolha está em como dividir o código:

- **Uma parte fixa e testada (o núcleo)**, copiada igual em todo app. A segurança (validação, texto que nunca vira fórmula, conferência do dono, uma gravação por vez) mora nela, então não depende de ser reescrita certo a cada app.
- **Uma parte pequena que muda (o App)**, que descreve as abas e as regras do app. É o único arquivo `.gs` que você escreve.
- **Na tela, o mesmo:** uma base fixa (visual e ajudantes) e o index do app. Separar HTML, CSS e JavaScript em arquivos incluídos por um modelo é a recomendação oficial do Google para o HTML Service, assim como carregar os dados depois que a página abre (`google.script.run`).

Para quem não programa, isso vira uma regra simples: os arquivos fixos são colados uma vez; nas melhorias do app, só App e index mudam.

## 2. Os arquivos

| Arquivo no editor | De onde vem | Muda? |
|---|---|---|
| `Nucleo.gs` | `assets/nucleo/Nucleo.gs`, copiado igual | Só quando sair versão nova do núcleo |
| `Tarefas.gs` (só com tarefas automáticas) | `assets/nucleo/Tarefas.gs`, copiado igual | Só com versão nova |
| `App.gs` | `assets/app-web/App.gs` ou `assets/planilha/App.gs`, adaptado | A cada mudança no app |
| `base.html` (só app da Web) | `assets/nucleo/base.html`, copiado igual | Só com versão nova |
| `index.html` (só app da Web) | `assets/app-web/index.html`, adaptado | A cada mudança na tela |
| `appsscript.json` | `assets/app-web/appsscript.json` | Só no modo avançado (clasp) |

No editor, os nomes aparecem como `Nucleo`, `Tarefas`, `App`, `base` e `index`; o editor completa a extensão.

O Google decide quais permissões pedir lendo todo o código do projeto, inclusive comentários. Por isso as tarefas automáticas ficam num arquivo à parte: um app sem tarefas não carrega `Tarefas.gs` e não pede a permissão de rodar sozinho. Pelo mesmo motivo, não cite nomes de serviços do Google (como o de e-mail ou o do Drive) em comentários de um app que não os usa.

## 3. O arquivo App: APP e TABELAS

```javascript
var APP = {
  nome: 'Meu App',            // título da página e dos e-mails
  fuso: 'America/Sao_Paulo',  // para "hoje" e para as tarefas
  tarefas: { enviarLembretes: 8, aoResponder: 'formulario' }, // opcional (ver automacoes.md)
  partes: [],                 // opcional: outros arquivos HTML que a tela pode incluir além da base
  localidade: 'pt_BR'         // opcional: idioma aplicado pelo setup quando a planilha é nova
};

var TABELAS = {
  registros: {                 // chave usada no código: lerLinhas_('registros')
    aba: 'Registros',          // nome da aba na planilha
    colunas: {                 // campo: { titulo da coluna na linha 1, tipo }
      id: { titulo: 'ID', tipo: 'id' },
      data: { titulo: 'Data', tipo: 'data' },
      categoria: { titulo: 'Categoria', tipo: 'opcao', opcoesDe: 'categorias' },
      valor: { titulo: 'Valor', tipo: 'dinheiro' },
      criadoEm: { titulo: 'Criado em', tipo: 'dataHora', padrao: 'agora' }
    },
    inicial: [],               // opcional: linhas criadas junto com a aba
    externa: false             // true quando outra ferramenta cria a aba (ex.: Google Forms)
  }
};
```

| Tipo | Na planilha | No código |
|---|---|---|
| `id` | texto; preenchido sozinho com um código aleatório | string |
| `texto` | texto puro, sempre com apóstrofo escondido | string |
| `opcao` | texto com lista suspensa (`opcoes: [...]` ou `opcoesDe: 'outraTabela'`, que usa a primeira coluna dela) | string |
| `numero` | número | número ou `null` se vazio |
| `dinheiro` | número com formato R$ | número ou `null` se vazio |
| `data` | data (dd/mm/aaaa), sem risco de pular dia | `'aaaa-mm-dd'` ou `''` |
| `dataHora` | data e hora; `padrao: 'agora'` preenche na gravação | `'aaaa-mm-ddTHH:mm'` |
| `marcador` | caixa de seleção | `true` / `false` |

O núcleo acha cada coluna pelo **título** na linha 1. A pessoa pode reordenar colunas ou criar colunas próprias (anotações, fórmulas) sem quebrar o app; só não pode renomear ou apagar um título que está em `TABELAS`. Se isso acontecer, o erro diz qual coluna sumiu.

Opcional: uma função `aoPreparar_(ss)` no App roda no fim do `setup`, para preparações extras.

## 4. O que o núcleo oferece

Públicas (alcançáveis de fora, por isso pequenas e protegidas): `setup()` e `incluir(nome)`, mais `instalarGatilhos()` no arquivo Tarefas.

Dados:

| Função | O que faz |
|---|---|
| `lerLinhas_(chave)` | Todas as linhas preenchidas, como objetos `{ campo: valor, _linha }` |
| `adicionarLinha_(chave, dados)` | Grava uma linha nova logo depois da última com dados; devolve o registro (com `id`) |
| `atualizarLinha_(chave, id, mudancas)` | Muda campos de uma linha achada pelo ID (o ID não muda) |
| `excluirLinha_(chave, id)` | Apaga a linha achada pelo ID |
| `acharLinha_(chave, id)` | Número da linha com aquele ID, ou 0 |
| `colunasDe_(chave)` | `{ campo: número da coluna }`, útil em `onEdit` |
| `planilha_()`, `aba_(chave)` | A planilha e a aba, também dentro do app da Web |

As três funções que gravam já usam a trava. Para uma operação que lê, decide e grava (ex.: conferir e registrar o vencedor do bingo), envolva tudo em `comTrava_(function () { ... })`; a trava pode ser aninhada.

**Memória por chamada.** Cada chamada ao app começa do zero no Google, e abrir a planilha e ler uma aba custa tempo. Por isso, dentro de uma mesma chamada, o núcleo abre a planilha uma vez e guarda o que já leu: a segunda `lerLinhas_` da mesma aba vem da memória. As funções que gravam relêem a aba dentro da trava (outra pessoa pode ter acabado de gravar) e apagam a memória daquela aba depois. Duas regras para o App: não altere os objetos que `lerLinhas_` devolve (copie antes), e grave sempre pelas funções do núcleo, para a memória não ficar velha.

**Ações de um toque.** Para marcar, curtir ou riscar algo, a tela pode mudar na hora e o servidor confirmar depois; se ele recusar, a tela volta e mostra o motivo. O exemplo `assets/exemplos/habitos/` faz isso (veja `comMarcacao` no index).

Segurança e validação: `exigirDono_()`, `ehDono_()`, `objeto_(v)`, `texto_(v, rotulo, { max, obrigatorio, multilinha })`, `numero_(v, rotulo, { min, max })`, `data_(v, rotulo)`, `opcao_(v, rotulo, lista)`, `simNao_(v, rotulo)`, `id_(v)`, `celulaTexto_(s)`.

Datas e números: `hojeISO_()`, `somarDias_(iso, dias)`, `serialDe_(iso)`, `isoDe_(valor, fuso)`, `paraNumero_(texto)`, `arred_(n)`.

Página: `paginaDoApp_('index')` (monta a página com título e ajuste para celular) e `paginaDeAviso_(mensagem)`.

## 5. A tela (base e index)

O index começa assim, e a base entra pelo modelo do Apps Script:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <?!= incluir('base'); ?>
</head>
```

A base traz o visual (cores com tema claro e escuro, cartões, formulários, listas, aviso) e estes ajudantes:

| Ajudante | Para quê |
|---|---|
| `$('id')` | Pega um elemento pelo id |
| `esc(valor)` | Escapa texto antes de montar HTML (obrigatório para todo dado) |
| `chamar('funcao', ...args)` | Chama uma função pública do App e devolve uma Promise |
| `enquantoSalva(botao, 'Salvando…', async () => {...})` | Desliga o botão durante a tarefa e mostra erros em linguagem simples |
| `confirmarComSegundoToque(botao)` | Para ações que apagam: o primeiro toque pede confirmação |
| `avisar(texto, 'erro')` | Mensagem curta no rodapé |
| `dinheiro.format(n)`, `nomeDoMes('2026-10')`, `rotuloDoDia(iso, hoje)` | Formatação em português |

Classes de visual prontas: `app`, `topo`, `cartao`, `rotulo`, `destaque`, `barras`/`barra`, `lado-a-lado`, `primario`, `icone`, `discreto`, `dica`, `vazio`, `dia`, `item`, `info`, `sub`, `valor`. Estilos só do app podem ir num `<style>` no index.

## 6. Regras para escrever o App

- **Nunca edite o núcleo nem a base para um app.** Se faltar algo neles, resolva no App ou no index. Se for algo que todo app deveria ter, diga à pessoa que é uma melhoria para a skill, não para este app.
- **Toda gravação passa pelas funções do núcleo** (`adicionarLinha_`, `atualizarLinha_`, `excluirLinha_`). Se precisar gravar direto numa célula (como num `onEdit`), grave número, data em série (`serialDe_`) ou texto com `celulaTexto_`.
- **Funções que a tela chama:** sem `_`, começam com `exigirDono_()` (app pessoal) ou com a conferência do participante (app de grupo), validam cada parâmetro e devolvem só os campos que a tela usa. Nunca devolva `_linha` nem linhas cruas.
- **Os cálculos ficam no App**, em funções internas. A tela só mostra o que recebe. Assim existe um número só para cada coisa, na tela, nos e-mails e para a IA.
- **Salvar e excluir devolvem a tela atualizada**, como `carregarTela()`: uma ida ao servidor por ação.
- **Comentário do topo do App sempre atualizado:** o que o app faz, formato, arquivos e abas. É ele que dá contexto quando a pessoa voltar numa conversa nova.
