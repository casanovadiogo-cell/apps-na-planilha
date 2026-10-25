# Apps em grupo (bingo, bolão, escala, votação, check-in)

Quando várias pessoas usam o mesmo app da Web, o modelo de segurança muda: o app continua rodando com a conta do dono, mas agora gente de fora chama as funções públicas. Tudo o que está em `seguranca.md` continua valendo; aqui vai o que muda. Se o grupo só precisa mandar informações (inscrição, presença), um formulário costuma bastar (`formatos.md`).

## A estrutura

- **Implantação:** "Executar como: Eu". Em "Quem pode acessar", escolha **Qualquer pessoa com uma Conta do Google** quando todo mundo tem conta Google (exige login e espanta curiosos), ou **Qualquer pessoa** quando há participantes sem conta (aí qualquer um com o link usa, então os limites abaixo são obrigatórios).
- **A planilha nunca é compartilhada.** Participantes só veem o que as funções públicas devolvem.
- **O servidor é o juiz.** Regras, sorteios, pontuação e conferências acontecem no App. A tela só pede ("confira minha cartela"), nunca afirma ("eu ganhei").
- **Devolva o mínimo.** Lista de participantes com apelidos, nunca e-mails, códigos ou linhas inteiras da planilha.
- **O `doGet` serve a página para todos:** `function doGet() { return paginaDoApp_('index'); }`. A proteção fica em cada função.

## Quem é quem, sem login

Em contas Google pessoais, quando o app roda como o dono, o Google não informa o e-mail de mais ninguém. Então:

- **O dono é reconhecido** pelo `exigirDono_()` do núcleo (o e-mail só aparece para ele). Use isso nas ações de administrador: sortear número, começar rodada, apagar dados. O dono usa o mesmo link do app, conectado com a própria conta. Uma função pública `souOrganizador()` que só devolve `ehDono_()` deixa a tela mostrar os botões de administrador; quem protege de verdade é o `exigirDono_()` em cada ação.
- **Participantes se identificam com um código.** Ao entrar, a pessoa escolhe um apelido e o núcleo gera um código aleatório (coluna de tipo `id`), guardado na planilha e no navegador dela (`localStorage`). As próximas chamadas mandam o código, e o servidor confere.

Avise a pessoa: quem tiver o código age como aquele participante. Isso basta para um jogo entre colegas, mas não para nada que envolva dinheiro ou dado sensível.

```javascript
// App.gs. Em TABELAS:
//   participantes: { aba: 'Participantes', colunas: {
//     codigo: { titulo: 'Código', tipo: 'id' },
//     apelido: { titulo: 'Apelido', tipo: 'texto' },
//     entrouEm: { titulo: 'Entrou em', tipo: 'dataHora', padrao: 'agora' } } }
var MAX_PARTICIPANTES = 80;

function entrar(apelido) {
  apelido = texto_(apelido, 'Apelido', { max: 24 });
  limitarRitmo_('entrar', 30); // no máximo 30 entradas por minuto no app todo
  return comTrava_(function () {
    if (lerLinhas_('participantes').length >= MAX_PARTICIPANTES) throw new Error('A sala está cheia.');
    var novo = adicionarLinha_('participantes', { apelido: apelido });
    return { codigo: novo.codigo, apelido: apelido };
  });
}

function souOrganizador() {
  return ehDono_();
}

function participante_(codigo) {
  codigo = id_(codigo);
  var achado = lerLinhas_('participantes').filter(function (p) { return p.codigo === codigo; })[0];
  if (!achado) throw new Error('Não encontrei você. Entre de novo.');
  return achado;
}

/** Limite simples de ritmo, por chave, numa janela de 1 minuto. */
function limitarRitmo_(chave, maximo) {
  var cache = CacheService.getScriptCache();
  var k = 'ritmo:' + chave;
  var n = Number(cache.get(k) || 0);
  if (n >= maximo) throw new Error('Muita gente ao mesmo tempo. Tente de novo em um minuto.');
  cache.put(k, String(n + 1), 60);
}
```

```javascript
// index.html: guardar o código no aparelho (pode falhar em janela anônima).
function lerCodigo() { try { return localStorage.getItem('codigo'); } catch (e) { return null; } }
function guardarCodigo(c) { try { localStorage.setItem('codigo', c); } catch (e) {} }
```

## Atualização "ao vivo"

Apps Script não empurra novidades para a tela. A tela pergunta de tempos em tempos:

```javascript
// Pergunta a cada 5 segundos, só enquanto a tela está visível.
setInterval(() => { if (document.visibilityState === 'visible') atualizar(); }, 5000);
```

Mantenha a função consultada leve: devolva só o que mudou e guarde o estado do jogo no `CacheService` (até 100 KB por chave, por até 6 horas), lendo a planilha só quando o cache estiver vazio. Cada consulta leva de meio segundo a dois. Por isso, Apps Script serve para bingo, votação e placar, mas não para jogo de reflexo.

## Exemplo: bingo entre colegas

- **Abas:** Participantes (código, apelido, entrou em), Cartelas (código, números), Sorteio (ordem, número, quando), Vencedores (apelido, quando).
- **Cartela:** gerada no servidor quando a pessoa entra e gravada na planilha. A tela recebe só a cartela dela.
- **Sorteio:** `sortearNumero()` com `exigirDono_()`. O dono abre o mesmo app e vê o botão "Sortear".
- **"BINGO!":** a tela chama `conferirBingo(codigo)`. O servidor compara a cartela gravada com os números sorteados e, dentro de `comTrava_()`, registra o vencedor com horário. O primeiro registrado ganha.
- **Depois do jogo:** uma função de administrador apaga participantes e cartelas.

## Checklist extra para apps em grupo

- [ ] Cada função pública valida tudo e confere o código do participante ou o dono.
- [ ] Ações de administrador com `exigirDono_()`.
- [ ] Limites: tamanho de texto, número de participantes, ritmo de chamadas.
- [ ] Nenhuma função devolve e-mail, código de outra pessoa ou linhas cruas da planilha.
- [ ] Testado numa janela anônima (é o que os outros veem).
- [ ] A pessoa sabe como apagar os dados depois e como cortar o acesso (**Implantar > Gerenciar implantações > Arquivar**).
