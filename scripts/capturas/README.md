# Capturas de tela do guia

As figuras em `content/modules/ROOT/images/capturas/` nao sao tiradas a mao:
`capturar.mjs` abre cada tela de `capturas.json` num navegador sem janela,
marca os elementos que o exercicio cita (borda e numero) e fotografa SO o
recorte pedido -- nunca a janela inteira, entao barra de endereco e hostname
ficam de fora. Regenerar e um passo do corte de edicao: as figuras da edicao
X.Y sao tiradas no Showroom modelo do cluster da edicao X.Y.

Como rodar (Node >= 20 e Playwright/patchright; o runner `browser.mjs` do
skill de automacao de navegador serve):

    CAPTURA_ENV=<arquivo k=v com grafana_url, openshift_console_url, guid,
                 usuario_console, senha_console>   # NUNCA versionado
    CAPTURA_SPEC=scripts/capturas/capturas.json
    CAPTURA_OUT=content/modules/ROOT/images/capturas
    node browser.mjs about:blank --script scripts/capturas/capturar.mjs

Cada item de `capturas.json`: `arquivo`, `url` (com `${variavel}` do env),
`esperar` (seletores), `pausa` (ms), `recorte` (seletor fotografado),
`marcar` (lista de `{texto|seletor, n, dentro}`), `login` (`openshift`).

Estado: oito figuras -- tres do Grafana (2.1 e 4.1), quatro da console (2.1
Observe > Metrics, 2.3 lista de policies, 4.x API Products, 5.3 PipelineRuns)
e uma do GitLab (5.2 merge requests). Logins: `login: openshift` (a console
manda para o Keycloak), `argo` (clica em LOG IN VIA OPENSHIFT antes),
`gitlab` (clica em "Entrar com o usuario do console" antes); o consentimento
do OAuth e aceito quando aparece. `quem: plataforma` usa o login de quem
opera a plataforma (usuario_console_plataforma no env) para telas do cluster
inteiro, como a Policy Topology. `viewport` e `clicar` por captura servem
para caber a tabela e esconder um grafico.

Nove figuras com a do Argo (5.1, a Application Synced): o Argo precisa de
`pausa` longa (20 s) depois do login -- a primeira carga da UI falha com
'Failed to load data' se fotografada cedo. Ainda nao sai: a Policy Topology
util (com o login da plataforma ela abre, mas desenha a turma inteira,
ilegivel; falta filtrar o namespace pela UI).
