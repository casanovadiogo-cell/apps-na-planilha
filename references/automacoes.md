# Tarefas que rodam sozinhas (gatilhos e lembretes)

Um gatilho faz o Google rodar uma função do app sem ninguém abrir nada: mandar um lembrete quando a vacina do cachorro está perto, avisar quando o mês passa da meta, atualizar números todo dia cedo. Funciona nos três formatos e é o que faz o app parecer "vivo" sem servidor.

## Os três tipos de gatilho

| Tipo | Como ligar | Permissão | Use para |
|---|---|---|---|
| Edição simples | Uma função chamada `onEdit(e)` no App. Liga sozinha. | Nenhuma | Reagir a uma caixa marcada ou a uma célula editada, mexendo só na própria planilha. Funciona também pelo app Planilhas do celular. |
| Diário | `APP.tarefas = { nomeDaFuncao: 8 }` e rodar `instalarGatilhos` | Rodar quando você não estiver presente (+ o que a função usar) | Lembretes, resumos, limpeza. O número é a hora do dia (8 = entre 8h e 9h). |
| A cada resposta de formulário | `APP.tarefas = { nomeDaFuncao: 'formulario' }` | Idem | Reagir a cada envio de um Google Forms ligado à planilha. |

Existe também `'edicao'` em `APP.tarefas`: um gatilho de edição instalado, que roda com as permissões do dono (por exemplo, para mandar e-mail quando alguém edita). Prefira o `onEdit` simples sempre que der, porque ele não precisa de permissão nenhuma.

`instalarGatilhos` está no arquivo fixo `assets/nucleo/Tarefas.gs`, que entra no projeto só quando o app tem `APP.tarefas` (sem ele, o Google não pede a permissão de rodar sozinho). A função apaga os gatilhos antigos das funções listadas e cria de novo, então pode rodar quantas vezes quiser. A pessoa roda pelo editor depois do `setup` e sempre que `APP.tarefas` mudar. O `onEdit` simples não precisa do arquivo Tarefas.

## Como escrever a função de uma tarefa

- **Pública por necessidade** (sem `_`), porque o Google chama pelo nome. Para isso ser seguro: não recebe dados de fora, não devolve nada e só faz a própria tarefa.
- **Sem `exigirDono_()`**: tarefa roda sem ninguém na tela. Ela roda com a conta de quem rodou `instalarGatilhos`.
- **Lê e grava pelo núcleo** (`lerLinhas_`, `adicionarLinha_`...).
- **E-mail só para o dono e em texto puro** (`body`), com `Session.getEffectiveUser().getEmail()`. E-mail para outras pessoas só com o consentimento delas.
- **Só avisa quando há algo para avisar.** E-mail diário vazio vira spam e a pessoa para de ler.

O exemplo completo está em `assets/planilha/App.gs` (caderneta do pet): um `onEdit` que registra "Fiz hoje" e calcula a próxima data, e um `enviarLembretes` diário com o que vence nos próximos 7 dias. O formato formulário tem um exemplo de tarefa a cada resposta em `formatos.md`.

## Cuidados

- **Explique as permissões novas** antes de a pessoa rodar `instalarGatilhos` (seção 4 de `seguranca.md`).
- **Quem pode editar o código controla a tarefa.** Ela roda o último código salvo, com a conta de quem a instalou. Mais um motivo para não dar edição na planilha a quem não é de confiança.
- **Onde conferir:** no editor, **Acionadores** (ícone de relógio, à esquerda) lista as tarefas ativas; **Execuções** mostra cada rodada e os erros.
- **Falhas:** quando uma tarefa falha, o Google manda um e-mail de aviso para o dono. Peça para a pessoa colar o erro na conversa, sem dados pessoais.
- **Limites da conta pessoal:** 90 minutos de tarefas por dia somadas, 20 gatilhos por projeto, 100 destinatários de e-mail por dia. Tarefas como essas levam segundos.
