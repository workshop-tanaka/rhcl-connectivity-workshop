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

Estado: quatro figuras -- tres do Grafana (2.1 e 4.1) e a da console (2.1,
Observe > Metrics). O login da console e o do Keycloak deste ambiente
(usuario/senha do participante no env); `viewport` e `clicar` por captura
servem para caber a tabela e esconder o grafico.
