#!/usr/bin/env python3
"""
Revisão automática de segurança para projetos Google Apps Script
feitos com a skill apps-na-planilha.

Uso:
    python revisar_seguranca.py <pasta ou arquivos...>

Lê arquivos .gs, .js, .html e appsscript.json e aponta padrões arriscados,
separados por gravidade:
    [CORRIGIR]  precisa mudar antes de entregar o código
    [CONFERIR]  pode estar certo, mas alguém precisa olhar com atenção
    [INFO]      contexto útil para explicar o app e as permissões

Também confere se os arquivos fixos (Nucleo, Tarefas, base) estão iguais
aos da skill. É uma rede de proteção, não substitui o checklist de
references/seguranca.md. Sai com código 1 quando existe algum [CORRIGIR].
Só usa a biblioteca padrão do Python.
"""

import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CORRIGIR, CONFERIR, INFO = "CORRIGIR", "CONFERIR", "INFO"
ORDEM = {CORRIGIR: 0, CONFERIR: 1, INFO: 2}

PASTA_FIXOS = Path(__file__).resolve().parent.parent / "assets" / "nucleo"
ARQUIVOS_FIXOS = {"nucleo": "Nucleo.gs", "tarefas": "Tarefas.gs", "base": "base.html"}

ENTRADAS_DO_GOOGLE = {
    "doGet", "doPost", "onOpen", "onEdit", "onInstall", "onSelectionChange", "onFormSubmit", "onChange",
}
PUBLICAS_DOS_FIXOS = {"setup", "incluir", "instalarGatilhos"}

SEGREDOS = [
    (re.compile(r"AIza[0-9A-Za-z_\-]{35}"), "uma chave de API do Google"),
    (re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}"), "uma chave de API da Anthropic"),
    (re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}"), "uma chave de API (formato OpenAI)"),
    (re.compile(r"\bghp_[A-Za-z0-9]{36}\b"), "um token do GitHub"),
    (re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]{10,}"), "um token do Slack"),
    (re.compile(r"\b\d{8,10}:[A-Za-z0-9_\-]{35}\b"), "um token de bot do Telegram"),
]
SEGREDO_GENERICO = re.compile(
    r"(?i)\b(api[_-]?key|apikey|token|secret|segredo|senha|password|chave)\w*\s*[:=]\s*['\"][^'\"\s]{12,}['\"]")

SERVICOS_SENSIVEIS = {
    "GmailApp": "ler e enviar e-mails do seu Gmail",
    "MailApp": "enviar e-mails em seu nome",
    "DriveApp": "ver e mexer em arquivos do seu Google Drive",
    "UrlFetchApp": "conectar com sites e serviços fora do Google",
    "CalendarApp": "ver e mexer na sua agenda",
    "ContactsApp": "ver seus contatos",
    "People.": "ver seus contatos",
    "FormApp": "ver e mexer nos seus formulários",
    "DocumentApp.openById": "abrir outros documentos seus",
    "ScriptApp": "rodar tarefas quando você não estiver presente",
}

ESCOPOS_AMPLOS = {
    "https://mail.google.com/": "acesso total ao Gmail",
    "https://www.googleapis.com/auth/gmail": "acesso ao Gmail",
    "https://www.googleapis.com/auth/drive": "acesso a todo o Google Drive",
    "https://www.googleapis.com/auth/script.external_request": "conexão com serviços fora do Google",
    "https://www.googleapis.com/auth/calendar": "acesso à agenda",
    "https://www.googleapis.com/auth/contacts": "acesso aos contatos",
}

DOMINIOS_DE_EXEMPLO = ("exemplo.com", "example.com", "example.org", "seudominio", "email.com")


class Relatorio:
    def __init__(self):
        self.itens = []

    def add(self, nivel, arquivo, linha, texto):
        self.itens.append((nivel, str(arquivo), linha, texto))

    def imprimir(self):
        if not self.itens:
            print("Nenhum padrão arriscado encontrado. Mesmo assim, passe pelo checklist de seguranca.md.")
            return 0
        vistos = set()
        for nivel, arquivo, linha, texto in sorted(self.itens, key=lambda i: (ORDEM[i[0]], i[1], i[2] or 0)):
            chave = (nivel, arquivo, linha, texto)
            if chave in vistos:
                continue
            vistos.add(chave)
            onde = f"{arquivo}:{linha}" if linha else arquivo
            print(f"[{nivel}] {onde}\n    {texto}")
        total = {n: sum(1 for i in self.itens if i[0] == n) for n in ORDEM}
        print(f"\nResumo: {total[CORRIGIR]} para corrigir, {total[CONFERIR]} para conferir, {total[INFO]} informativos.")
        return 1 if total[CORRIGIR] else 0


def numero_da_linha(texto, posicao):
    return texto.count("\n", 0, posicao) + 1


def achar_segredos(texto):
    """Lista (posição, descrição) de segredos; o padrão genérico só entra em linhas sem um específico."""
    achados, linhas = [], set()
    for padrao, nome in SEGREDOS:
        for m in padrao.finditer(texto):
            achados.append((m.start(), nome))
            linhas.add(numero_da_linha(texto, m.start()))
    for m in SEGREDO_GENERICO.finditer(texto):
        if numero_da_linha(texto, m.start()) not in linhas:
            achados.append((m.start(), "um valor que parece senha ou chave"))
    return achados


def sem_comentarios(codigo):
    """Troca comentários por espaços (mantendo as quebras de linha) para não acusar exemplos em comentários."""
    padrao = re.compile(r"/\*.*?\*/|//[^\n]*|'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"|`(?:\\.|[^`\\])*`", re.S)
    return padrao.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)) if m.group(0).startswith("/") else m.group(0), codigo)


def corpo_da_funcao(codigo, inicio):
    """Devolve o texto entre a primeira { depois de 'inicio' e a } que a fecha."""
    abre = codigo.find("{", inicio)
    if abre < 0:
        return ""
    nivel = 0
    for i in range(abre, len(codigo)):
        if codigo[i] == "{":
            nivel += 1
        elif codigo[i] == "}":
            nivel -= 1
            if nivel == 0:
                return codigo[abre + 1:i]
    return codigo[abre + 1:]


def normalizar(texto):
    linhas = [l.rstrip() for l in texto.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    return "\n".join(linhas).strip()


def tipo_de_fixo(arquivo, texto):
    """Diz se o arquivo é um dos fixos da skill, pelo nome ou pelo cabeçalho."""
    nome = arquivo.stem.lower()
    for tipo, original in ARQUIVOS_FIXOS.items():
        if nome == Path(original).stem.lower():
            return tipo
    cabecalho = texto[:400]
    if "NÚCLEO · skill" in cabecalho:
        return "nucleo"
    if "TAREFAS · skill" in cabecalho:
        return "tarefas"
    if "BASE · skill" in cabecalho:
        return "base"
    return None


def conferir_fixo(tipo, exibir, texto, rel):
    original = PASTA_FIXOS / ARQUIVOS_FIXOS[tipo]
    if not original.exists():
        return
    referencia = original.read_text(encoding="utf-8")
    if normalizar(texto) == normalizar(referencia):
        rel.add(INFO, exibir, None, f"Arquivo fixo {ARQUIVOS_FIXOS[tipo]} igual ao da skill.")
        return
    versao = re.search(r"versão (\d+)", texto[:400])
    versao_ref = re.search(r"versão (\d+)", referencia[:400])
    if versao and versao_ref and versao.group(1) != versao_ref.group(1):
        rel.add(INFO, exibir, None,
                f"Arquivo fixo na versão {versao.group(1)}; a skill tem a versão {versao_ref.group(1)}. "
                "Ofereça a atualização (o arquivo novo vem inteiro).")
    else:
        rel.add(CONFERIR, exibir, None,
                f"O arquivo fixo {ARQUIVOS_FIXOS[tipo]} está diferente do original da skill. As proteções moram nele: "
                "volte ao original e coloque o que for específico do app no App ou no index.")


def ler_manifesto(arquivos, rel):
    for arq in arquivos:
        if arq.name == "appsscript.json":
            try:
                return json.loads(arq.read_text(encoding="utf-8")), arq
            except json.JSONDecodeError as e:
                rel.add(CORRIGIR, arq.name, None, f"appsscript.json não é um JSON válido: {e}")
    return None, None


def revisar_manifesto(man, exibir, rel):
    if man is None:
        rel.add(INFO, "(projeto)", None,
                "Sem appsscript.json: no app da Web, o acesso é o escolhido na tela de implantação. "
                "Confira lá: 'Executar como: Eu' e 'Quem pode acessar: Somente eu' para app pessoal.")
        return None
    web = man.get("webapp") or {}
    acesso = web.get("access")
    executa = web.get("executeAs")
    if acesso == "ANYONE_ANONYMOUS":
        rel.add(CONFERIR, exibir, None,
                "Acesso 'Qualquer pessoa' (sem login). Só faz sentido em app de grupo sem dados pessoais, "
                "com validação forte em todas as funções públicas. Quem tiver o link usa.")
    elif acesso == "ANYONE":
        rel.add(CONFERIR, exibir, None,
                "Acesso 'Qualquer pessoa com uma Conta do Google'. Confirme que as funções públicas validam tudo "
                "e nunca devolvem dados que a pessoa não deveria ver.")
    elif acesso == "DOMAIN":
        rel.add(INFO, exibir, None, "Acesso restrito ao domínio da empresa (Google Workspace).")
    elif acesso == "MYSELF":
        rel.add(INFO, exibir, None, "Acesso 'Somente eu': só a sua conta Google abre o app.")
    if executa == "USER_ACCESSING":
        rel.add(CONFERIR, exibir, None,
                "'Executar como: usuário que acessa'. Cada pessoa precisa de acesso à planilha, e quem tem acesso "
                "à planilha vê todos os dados e o código. Para apps de grupo, prefira executar como você.")
    for lib in (man.get("dependencies") or {}).get("libraries") or []:
        nome = lib.get("userSymbol", "?")
        modo = " em modo de desenvolvimento" if lib.get("developmentMode") else ""
        rel.add(CONFERIR, exibir, None,
                f"Biblioteca de terceiros '{nome}'{modo}: ela roda com as SUAS permissões. Use só de fonte confiável, "
                "com versão fixa e developmentMode desligado.")
    for escopo in man.get("oauthScopes") or []:
        for prefixo, explicacao in ESCOPOS_AMPLOS.items():
            if escopo.startswith(prefixo):
                rel.add(CONFERIR, exibir, None, f"Permissão ampla no manifesto ({escopo}): {explicacao}. Confirme a necessidade.")
    return acesso


def nomes_de_tarefas(textos_servidor):
    """Funções listadas em APP.tarefas (são chamadas pelo Google, não pela tela)."""
    nomes = set()
    for texto in textos_servidor:
        for m in re.finditer(r"tarefas\s*:\s*\{([^}]*)\}", sem_comentarios(texto)):
            nomes.update(re.findall(r"([A-Za-z_$][\w$]*)\s*:", m.group(1)))
    return nomes


def revisar_servidor(exibir, texto, acesso, rel, projeto, eh_fixo):
    limpo = sem_comentarios(texto)
    compartilhado = acesso not in ("MYSELF", None)

    for pos, nome in achar_segredos(limpo):
        rel.add(CORRIGIR, exibir, numero_da_linha(limpo, pos),
                f"Parece haver {nome} no código. Tire do código e guarde em "
                "Configurações do projeto > Propriedades do script (a própria pessoa cola lá).")

    for m in re.finditer(r"\beval\s*\(|\bnew\s+Function\s*\(", limpo):
        rel.add(CORRIGIR, exibir, numero_da_linha(limpo, m.start()), "eval/new Function executa texto como código. Remova.")

    for m in re.finditer(r"XFrameOptionsMode\.ALLOWALL", limpo):
        rel.add(CONFERIR, exibir, numero_da_linha(limpo, m.start()),
                "ALLOWALL deixa qualquer site embutir o app (risco de clickjacking). Só use para embutir no Google Sites.")

    for m in re.finditer(r"ScriptApp\.getOAuthToken", limpo):
        rel.add(CONFERIR, exibir, numero_da_linha(limpo, m.start()),
                "Token de acesso da sua conta: nunca devolva para a tela nem grave na planilha.")

    for m in re.finditer(r"\bopenBy(?:Id|Url)\s*\(\s*['\"]", texto):
        rel.add(CONFERIR, exibir, numero_da_linha(texto, m.start()),
                "ID ou link de arquivo escrito no código. Prefira guardar nas Propriedades do script (pelo setup), "
                "assim o código pode ser compartilhado sem expor a planilha.")
    for m in re.finditer(r"docs\.google\.com/(?:spreadsheets|document|forms|presentation)/d/[A-Za-z0-9_\-]{20,}", texto):
        rel.add(CONFERIR, exibir, numero_da_linha(texto, m.start()),
                "Link de arquivo do Google no código. Evite deixar endereços dos seus arquivos no código.")

    for m in re.finditer(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9.\-]+", limpo):
        if not any(d in m.group(0).lower() for d in DOMINIOS_DE_EXEMPLO):
            rel.add(CONFERIR, exibir, numero_da_linha(limpo, m.start()),
                    f"E-mail escrito no código ({m.group(0)}): é dado pessoal. Use Session ou Propriedades do script.")
    for m in re.finditer(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b", texto):
        rel.add(CORRIGIR, exibir, numero_da_linha(texto, m.start()), "Parece um CPF no código. Dado pessoal não fica no código.")

    if "@OnlyCurrentDoc" in texto and projeto["abre_por_id"]:
        rel.add(CORRIGIR, exibir, None,
                "@OnlyCurrentDoc junto com openById: num app da Web isso falha por falta de permissão. "
                "Tire o @OnlyCurrentDoc (o app da Web precisa abrir a planilha pelo ID).")

    for servico, explicacao in SERVICOS_SENSIVEIS.items():
        if re.search(r"\b" + re.escape(servico), texto):
            rel.add(INFO, exibir, None,
                    f"Usa {servico.rstrip('.')}: o Google vai pedir permissão para {explicacao}. "
                    "Confirme que é necessário e explique isso à pessoa antes da autorização. "
                    "(O Google lê o código todo, inclusive comentários.)")

    for m in re.finditer(r"createHtmlOutput\s*\([^;]*\be\.parameters?\b", limpo):
        rel.add(CONFERIR, exibir, numero_da_linha(limpo, m.start()),
                "Parâmetro da URL indo direto para o HTML: qualquer um pode montar um link que injeta código. "
                "Escape o valor antes ou mostre-o na tela com textContent.")

    if re.search(r"\bfunction\s+doPost\s*\(", limpo):
        rel.add(CONFERIR, exibir, None,
                "doPost recebe dados de qualquer lugar que tenha o link. Exija um segredo guardado nas "
                "Propriedades do script, compare no servidor e valide cada campo.")

    escreve = re.search(r"\.(setValues?|appendRow)\s*\(", limpo)
    if escreve and not projeto["tem_sanitizador"]:
        rel.add(CONFERIR, exibir, numero_da_linha(limpo, escreve.start()),
                "Grava na planilha sem uma função que neutralize fórmulas. Texto vindo de fora que começa com "
                "= + - @ pode virar fórmula. Use as funções de gravação do núcleo ou celulaTexto_.")
    for m in re.finditer(r"\.setFormulas?\s*\(", limpo):
        rel.add(CONFERIR, exibir, numero_da_linha(limpo, m.start()),
                "setFormula: confirme que nenhum texto vindo de fora entra na fórmula.")
    if escreve and compartilhado and not projeto["tem_trava"]:
        rel.add(CONFERIR, exibir, None,
                "App compartilhado gravando sem trava (LockService): duas pessoas ao mesmo tempo podem se atropelar.")

    if compartilhado and re.search(r"Session\.getActiveUser\s*\(", limpo) and not eh_fixo:
        rel.add(INFO, exibir, None,
                "Em contas Google pessoais, getActiveUser() vem vazio para outras pessoas quando o app roda como você. "
                "Serve para reconhecer o dono, não como login dos participantes.")

    logs = len(re.findall(r"\b(console\.(log|info|warn|error)|Logger\.log)\s*\(", limpo))
    if logs:
        rel.add(INFO, exibir, None, f"{logs} registro(s) de log. Não registre dados pessoais nem valores sensíveis nos logs.")

    for m in re.finditer(r"^function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)", limpo, re.M):
        nome, params = m.group(1), [p.strip() for p in m.group(2).split(",") if p.strip()]
        projeto["funcoes"].add(nome)
        if nome.endswith("_") or nome in ENTRADAS_DO_GOOGLE or nome in projeto["tarefas"]:
            continue
        if eh_fixo and nome in PUBLICAS_DOS_FIXOS:
            continue
        corpo = corpo_da_funcao(limpo, m.end())
        linha = numero_da_linha(limpo, m.start())
        for p in params:
            if re.search(r"getSheetByName\s*\(\s*" + re.escape(p) + r"\s*\)|getRange\s*\(\s*" + re.escape(p) + r"\s*[,)]"
                         r"|(?:lerLinhas_|aba_|adicionarLinha_|excluirLinha_|atualizarLinha_)\s*\(\s*" + re.escape(p) + r"\s*[,)]", corpo):
                rel.add(CORRIGIR, exibir, linha,
                        f"A função pública {nome}() deixa a tela escolher qual aba ou intervalo ler/gravar ('{p}'). "
                        "Qualquer pessoa com acesso ao app poderia ler a planilha inteira. Fixe a tabela no servidor.")
        protegida = re.search(r"exigir\w*\(|ehDono_?\(|participante_\(|verificar\w*\(|autoriz\w*\(", corpo)
        if compartilhado:
            rel.add(CONFERIR, exibir, linha,
                    f"{nome}() é pública: qualquer pessoa com acesso ao app pode chamá-la com qualquer dado. "
                    "Confirme validação de cada parâmetro e que ela só devolve o necessário.")
        elif not protegida and acesso == "MYSELF":
            rel.add(INFO, exibir, linha,
                    f"{nome}() é pública e não confere o dono. Em app 'Somente eu' o Google já barra os outros, "
                    "mas chamar exigirDono_() protege se o acesso for mudado por engano.")


def revisar_tela(exibir, texto, rel, chamadas, projeto):
    for pos, nome in achar_segredos(texto):
        rel.add(CORRIGIR, exibir, numero_da_linha(texto, pos),
                f"Parece haver {nome} na tela. Tudo que está no HTML é visível para quem abre o app. "
                "Chaves ficam só no servidor, nas Propriedades do script.")
    for m in re.finditer(r"<\?!=", texto):
        if not re.match(r"<\?!=\s*(incluir|include)\s*\(", texto[m.start():m.start() + 60]):
            rel.add(CONFERIR, exibir, numero_da_linha(texto, m.start()),
                    "<?!= imprime sem escapar. Use <?= ?> para dados; <?!= só para incluir arquivos do próprio projeto.")
    for m in re.finditer(r"\beval\s*\(|\bnew\s+Function\s*\(|setTimeout\s*\(\s*['\"]", texto):
        rel.add(CORRIGIR, exibir, numero_da_linha(texto, m.start()), "Executa texto como código no navegador. Remova.")
    for m in re.finditer(r"<script[^>]+src=[\"']https?://[^\"']+[\"'][^>]*>", texto, re.I):
        sem_integridade = "" if "integrity=" in m.group(0) else " Sem 'integrity': se o site da biblioteca for invadido, o código muda."
        rel.add(CONFERIR, exibir, numero_da_linha(texto, m.start()),
                "Script de terceiros rodando no app. Prefira não usar bibliotecas externas, ou fixe a versão." + sem_integridade)

    usa_html_dinamico = re.search(r"\.(innerHTML|outerHTML)\s*[+]?=|insertAdjacentHTML|document\.write", texto)
    if usa_html_dinamico and not projeto["tem_escape"]:
        rel.add(CORRIGIR, exibir, numero_da_linha(texto, usa_html_dinamico.start()),
                "Monta HTML com dados mas o projeto não tem função de escape. Inclua a base (que traz esc()) "
                "e passe todo dado por ela, ou use textContent.")
    if usa_html_dinamico:
        for tl in re.finditer(r"`(?:\\.|[^`\\])*`", texto, re.S):
            literal = tl.group(0)
            if "<" not in literal:
                continue
            for interp in re.finditer(r"\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", literal):
                expr = interp.group(1).strip()
                if re.match(r"^(esc|escape\w*|escapar\w*)\(", expr):
                    continue
                if re.match(r"^(Math\.\w+|Number|parseInt|parseFloat)\(", expr) or re.fullmatch(r"[\d.]+", expr):
                    continue
                if re.fullmatch(r"[^?]+\?\s*(['\"])[^'\"]*\1\s*:\s*(['\"])[^'\"]*\2", expr):
                    continue
                rel.add(CONFERIR, exibir, numero_da_linha(texto, tl.start() + interp.start()),
                        f"Dado entrando no HTML sem esc(): ${{{expr}}}. Se o valor puder ter texto digitado por alguém, use esc().")
    if re.search(r"localStorage\.setItem|sessionStorage\.setItem", texto):
        rel.add(INFO, exibir, None, "Guarda dados no navegador do aparelho. Não guarde nada sensível ali.")
    for m in re.finditer(r"google\.script\.run(?:\s*\.\s*with\w+\s*\([^()]*(?:\([^()]*\)[^()]*)*\))*\s*\.\s*(?!with)([A-Za-z0-9_$]+)\s*\(", texto):
        chamadas.append((exibir, numero_da_linha(texto, m.start()), m.group(1)))
    # Chamadas pelo ajudante da base: chamar('nomeDaFuncao', ...)
    for m in re.finditer(r"\bchamar\s*\(\s*['\"]([A-Za-z0-9_$]+)['\"]", texto):
        chamadas.append((exibir, numero_da_linha(texto, m.start()), m.group(1)))


def main(argumentos):
    if not argumentos:
        print(__doc__)
        return 2
    arquivos, exibir = [], {}
    for a in argumentos:
        p = Path(a)
        if p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file() and f.suffix.lower() in (".gs", ".js", ".html", ".json") and "node_modules" not in f.parts:
                    arquivos.append(f)
                    exibir[f] = f.relative_to(p).as_posix()
        elif p.is_file():
            arquivos.append(p)
            exibir[p] = p.name
        else:
            print(f"Não encontrei: {a}")
            return 2

    textos = {arq: arq.read_text(encoding="utf-8", errors="replace") for arq in arquivos}
    servidor = [a for a in arquivos if a.suffix.lower() in (".gs", ".js")]
    telas = [a for a in arquivos if a.suffix.lower() == ".html"]
    limpos = [sem_comentarios(textos[a]) for a in servidor]
    projeto = {
        "tem_sanitizador": any(re.search(r"function\s+\w*(celulaTexto|semFormula|textoSeguro|sanitiz)\w*\s*\(", t, re.I)
                               or re.search(r"[\"']'[\"']\s*\+", textos[a]) for a, t in zip(servidor, limpos)),
        "tem_trava": any("LockService" in t for t in limpos),
        "tem_escape": any(re.search(r"function\s+(esc|escape\w*|escapar\w*)\s*\(|const\s+(esc|escape\w*|escapar\w*)\s*=", textos[a])
                          for a in telas),
        "abre_por_id": any(re.search(r"\bopenBy(?:Id|Url)\s*\(", t) for t in limpos),
        "tarefas": nomes_de_tarefas([textos[a] for a in servidor]),
        "funcoes": set(),
    }

    rel = Relatorio()
    manifesto, arq_man = ler_manifesto(arquivos, rel)
    acesso = revisar_manifesto(manifesto, exibir.get(arq_man), rel)
    chamadas = []
    for arq in arquivos:
        texto = textos[arq]
        fixo = tipo_de_fixo(arq, texto) if arq.suffix.lower() in (".gs", ".js", ".html") else None
        if fixo:
            conferir_fixo(fixo, exibir[arq], texto, rel)
        if arq.suffix.lower() in (".gs", ".js"):
            revisar_servidor(exibir[arq], texto, acesso, rel, projeto, eh_fixo=bool(fixo))
        elif arq.suffix.lower() == ".html":
            revisar_tela(exibir[arq], texto, rel, chamadas, projeto)
    for arq, linha, nome in chamadas:
        if nome.endswith("_"):
            rel.add(CORRIGIR, arq, linha, f"A tela chama {nome}(), mas funções terminadas em '_' são internas e não podem ser chamadas.")
        elif projeto["funcoes"] and nome not in projeto["funcoes"]:
            rel.add(CONFERIR, arq, linha, f"A tela chama {nome}(), que não existe no código do servidor.")
    print(f"Arquivos revisados: {', '.join(exibir[a] for a in arquivos) or 'nenhum'}\n")
    return rel.imprimir()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
