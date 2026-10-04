#!/usr/bin/env bash
# valida-conteudo.sh -- o conteudo do workshop renderiza, e os links nao
# derrubam o painel.
#
# POR QUE ISTO EXISTE: em 2026-10-02 um endereco da API abria DENTRO do painel
# do Showroom, e o participante perdia o workshop para ver uma pagina de 401.
# O fonte parecia correto -- o '^' (target=_blank) estava em 100% dos macros de
# link. O defeito estava onde o '^' nao alcanca: uma URL SEM macro, inclusive
# dentro de backtick, e auto-linkada pelo asciidoctor, e o autolink nao leva
# target:
#
#   URL em backtick    -> <code><a href=... class="bare">   MESMA ABA
#   macro com o ^      -> <a href=... target="_blank">       aba nova
#
# Dai a forma desta verificacao: ela mede o HTML RENDERIZADO, nao o fonte.
# Nenhuma leitura do .adoc teria pego aquele caso.
#
# As tres perguntas:
#   1. toda pagina renderiza sem erro de sintaxe?
#   2. todo link externo abre em aba nova?
#   3. todo xref aponta para pagina que existe, e o nav cobre as paginas?
#
# Uso:
#   bash scripts/valida-conteudo.sh
#
# Pre-requisito: asciidoctor. Nao vem nesta maquina por padrao --
# 'gem install --user-install --no-document asciidoctor' resolve, e o script
# acha o binario em "$(ruby -e 'print Gem.user_dir')/bin" sozinho.
#
# COMPATIVEL COM BASH 3.2 (o /bin/bash do macOS): sem 'mapfile', sem ';;&'.
# A primeira versao usava mapfile e morria so nesta maquina.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

if [[ -t 1 ]]; then
  _RED=$'\033[0;31m'; _GRN=$'\033[0;32m'; _BLU=$'\033[0;34m'
  _DIM=$'\033[2m'; _RST=$'\033[0m'
else _RED=""; _GRN=""; _BLU=""; _DIM=""; _RST=""; fi
_sec() { printf '\n%s== %s ==%s\n' "$_BLU" "$*" "$_RST"; }
_ok()  { printf '  %s✓%s %s\n' "$_GRN" "$_RST" "$*"; }
_bad() { printf '  %s✗%s %s\n' "$_RED" "$_RST" "$1"
         [[ -n "${2:-}" ]] && printf '      %s→ %s%s\n' "$_DIM" "$2" "$_RST"
         FALHAS=$((FALHAS+1)); return 0; }

FALHAS=0

if ! command -v asciidoctor >/dev/null 2>&1 && command -v ruby >/dev/null 2>&1; then
  PATH="$(ruby -e 'print Gem.user_dir')/bin:$PATH"; export PATH
fi
command -v asciidoctor >/dev/null 2>&1 || {
  printf '%s[X]%s asciidoctor nao encontrado.\n' "$_RED" "$_RST" >&2
  printf '    gem install --user-install --no-document asciidoctor\n' >&2
  exit 1
}

PAGINAS="content/modules/ROOT/pages"
PARTIAIS="$PWD/content/modules/ROOT/partials"
NAV="content/modules/ROOT/nav.adoc"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT INT TERM

# ----- 1. render -----------------------------------------------------------
# O asciidoctor nu nao conhece 'partial$' nem o 'xref:' entre paginas (sao do
# Antora). As partiais IMPORTAM para o resultado -- e nelas que moram as linhas
# de credencial --, entao o caminho e resolvido antes; os xref sao conferidos
# no fonte, no passo 3.
_sec "render"
mkdir -p "$TMP/src" "$TMP/html"
for _f in "$PAGINAS"/*.adoc; do
  # [$] e nao \$: em aspas duplas o bash come a barra, o sed recebe '$' nu e o
  # trata como ANCORA de fim de linha -- a substituicao nunca casa no meio da
  # linha, as partiais nao entram, e o render acusa 20 includes ausentes. A
  # classe de um caractere nao precisa de escape nenhum.
  sed "s|include::partial[$]|include::${PARTIAIS}/|" "$_f" > "$TMP/src/$(basename "$_f")"
done

# Os atributos saem do content/antora.yml -- a MESMA fonte que o build usa.
# Valor vazio e passado como 'chave=', e importa que seja: as linhas de
# credencial tem dois ramos, e o do atributo vazio e o que o RHDP serve.
python3 - > "$TMP/attrs" <<'PY'
import re
dentro = False
for l in open('content/antora.yml').read().splitlines():
    if l.strip() == 'attributes:':
        dentro = True
        continue
    if not dentro:
        continue
    m = re.match(r'^    ([a-z0-9_-]+): *(.*)$', l)
    if m:
        v = m.group(2).strip().strip(chr(34)).strip(chr(39))
        print('%s=%s' % (m.group(1), v))
    elif l.strip() and not l.startswith('    '):
        break
PY

_ATTRS=()
while IFS= read -r _a; do
  [[ -n "$_a" ]] && _ATTRS+=("-a" "$_a")
done < "$TMP/attrs"

_erros="$(asciidoctor -s "${_ATTRS[@]}" -D "$TMP/html" "$TMP/src"/*.adoc 2>&1 \
          | grep -v 'invalid reference' || true)"
_n="$(find "$TMP/html" -name '*.html' | wc -l | tr -d ' ')"
if [[ -n "$_erros" ]]; then
  _bad "o asciidoctor reclamou ao renderizar"
  printf '%s\n' "$_erros" | head -20 | sed 's/^/      /'
else
  _ok "${_n} pagina(s) renderizadas sem erro"
fi

# ----- 2. link externo abre em aba nova ------------------------------------
# A pergunta que o fonte nao responde. Link externo sem target="_blank" navega
# no painel do Showroom, e o participante perde o lugar no workshop.
_sec "links externos"
python3 - "$TMP/html" <<'PY'
import glob, os, re, sys
A = re.compile(r'<a\s+href="(https?://[^"]*)"([^>]*)>')
maus = []
total = 0
for h in sorted(glob.glob(os.path.join(sys.argv[1], '*.html'))):
    for m in A.finditer(open(h).read()):
        total += 1
        if 'target="_blank"' not in m.group(2):
            maus.append((os.path.basename(h)[:-5], m.group(1)))
if maus:
    print('  %d link(s) externo(s) abrem na MESMA aba:' % len(maus))
    for p, u in maus[:12]:
        print('      %-26s %s' % (p, u[:80]))
    print('      no macro, use o ^ no fim do texto; se o endereco e so para LER,')
    print('      escape o autolink com barra invertida. Ver a 5.30 do CONHECIMENTO.')
    sys.exit(1)
print('  %d link(s) externo(s), todos em aba nova' % total)
PY
if [[ "$?" -ne 0 ]]; then FALHAS=$((FALHAS+1)); fi

# ----- 3. xref e nav -------------------------------------------------------
_sec "navegacao"
python3 - "$PAGINAS" "$NAV" <<'PY'
import os, re, sys
paginas_dir, nav = sys.argv[1], sys.argv[2]
pages = set(f for f in os.listdir(paginas_dir) if f.endswith('.adoc'))
ruim = 0
for f in sorted(pages):
    for n, l in enumerate(open(os.path.join(paginas_dir, f)), 1):
        for m in re.finditer(r'xref:([A-Za-z0-9._-]+\.adoc)', l):
            if m.group(1) not in pages:
                print('  xref morto: %s:%d -> %s' % (f, n, m.group(1)))
                ruim += 1
if not ruim:
    print('  todo xref aponta para pagina existente')
no_nav = set(re.findall(r'xref:([A-Za-z0-9._-]+\.adoc)', open(nav).read()))
falta = sorted(no_nav - pages)
orfa = sorted(pages - no_nav)
if falta:
    print('  no nav e sem arquivo: %s' % ' '.join(falta))
    ruim += 1
if orfa:
    print('  arquivo fora do nav (ninguem chega nela): %s' % ' '.join(orfa))
    ruim += 1
if not falta and not orfa:
    print('  nav e paginas casam exatamente (%d)' % len(pages))
sys.exit(1 if ruim else 0)
PY
if [[ "$?" -ne 0 ]]; then FALHAS=$((FALHAS+1)); fi

printf '\n'
if [[ "$FALHAS" -eq 0 ]]; then
  printf '%s[OK]%s o conteudo esta publicavel.\n' "$_GRN" "$_RST"
  exit 0
fi
printf '%s[X]%s %d verificacao(oes) falharam.\n' "$_RED" "$_RST" "$FALHAS"
exit 1
