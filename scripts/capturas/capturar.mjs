// Captura de telas para o guia: le a especificacao em CAPTURA_SPEC (JSON),
// abre cada tela, marca os elementos citados pelo exercicio (borda + numero)
// e fotografa SO o recorte pedido -- nunca a janela inteira (sem barra de
// endereco, sem hostname). Roda sobre uma Page do Playwright.
import fs from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync(process.env.CAPTURA_ENV, 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] }))
const spec = JSON.parse(fs.readFileSync(process.env.CAPTURA_SPEC, 'utf8'))
const outDir = process.env.CAPTURA_OUT
const subst = s => s.replace(/\$\{(\w+)\}/g, (_, k) => env[k] ?? '')

const MARCA = `
  .cap-marca { outline: 3px solid #e4572e !important; outline-offset: 2px; position: relative; }
  .cap-marca.cap-interna { outline-offset: -3px; }
  .cap-num { position: absolute; z-index: 99999; background: #e4572e; color: #fff; font: bold 14px/22px sans-serif;
             width: 22px; height: 22px; border-radius: 50%; text-align: center; box-shadow: 0 0 0 2px #fff; pointer-events: none; }
`

// Logins: todos terminam no Keycloak deste ambiente ("Sign in to sso").
// 'openshift' = a console manda direto para o formulario; 'argo' = clicar em
// LOG IN VIA OPENSHIFT antes; 'gitlab' = clicar em "Entrar com o usuario do
// console" antes. Se o formulario nao aparecer (sessao ja aberta), segue.
async function keycloak(page, quem) {
  // quem: 'participante' (padrao) ou 'plataforma' (o login de quem opera a
  // plataforma, para as telas que sao do cluster inteiro, como a Policy Topology)
  const u = quem === 'plataforma' ? env.usuario_console_plataforma : env.usuario_console
  const p = quem === 'plataforma' ? env.senha_console_plataforma : env.senha_console
  const user = page.locator('input[name="username"], #username')
  try { await user.first().waitFor({ timeout: 15000 }) } catch { return false }
  await user.first().fill(u)
  await page.locator('input[name="password"], #password').first().fill(p)
  await page.locator('#kc-login, button[type="submit"], input[type="submit"]').first().click()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000)
  return true
}
async function login(page, tipo, quem) {
  if (tipo === 'argo')   { try { await page.locator('text=LOG IN VIA OPENSHIFT').first().click({ timeout: 10000 }) } catch {} }
  if (tipo === 'gitlab') { try { await page.locator('text=Entrar com o usuario do console').first().click({ timeout: 10000 }) } catch {} }
  const ok = await keycloak(page, quem)
  // o OAuth do OpenShift pede consentimento na primeira vez (Argo, GitLab)
  try { await page.locator('input[name="approve"], button:has-text("Allow selected permissions")').first().click({ timeout: 8000 }); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(2000) } catch {}
  return ok
}

export default async function run(page) {
  const feitos = []
  for (const cap of spec) {
    // viewport por captura: uma tela com tabela abaixo da dobra pede mais altura
    await page.setViewportSize(cap.viewport || { width: 1440, height: 900 })
    await page.goto(subst(cap.url), { waitUntil: 'domcontentloaded', timeout: 90000 })
    if (cap.login) {
      await page.waitForTimeout(1500)
      if (await login(page, cap.login, cap.quem)) await page.goto(subst(cap.url), { waitUntil: 'domcontentloaded', timeout: 90000 })
    }
    for (const sel of cap.esperar ?? []) await page.locator(subst(sel)).first().waitFor({ timeout: 90000 })
    if (cap.pausa) await page.waitForTimeout(cap.pausa)
    // cliques de arrumacao antes de fotografar (ex.: esconder um grafico)
    for (const sel of cap.clicar ?? []) { try { await page.locator(subst(sel)).first().click({ timeout: 5000 }); await page.waitForTimeout(500) } catch {} }
    await page.addStyleTag({ content: MARCA })
    // marca: cada item e {texto|seletor, n, dentro?}; 'texto' casa a folha cujo texto e exatamente aquele
    const marcados = await page.evaluate(({ itens, recorte }) => {
      const root = recorte ? document.querySelector(recorte) : document
      const r = []
      for (const it of itens) {
        let el = null
        if (it.seletor) el = (it.dentro ? root : document).querySelector(it.seletor)
        if (!el && it.texto) {
          const folhas = [...(it.dentro ? root : document).querySelectorAll('*')]
            .filter(e => e.children.length === 0 && (e.innerText || e.textContent || '').trim() === it.texto)
          el = folhas[0] || null
          // sem folha com o texto exato (o rotulo mistura <strong> e texto, por
          // exemplo): o elemento mais fundo cujo texto inteiro e aquele
          if (!el) el = [...(it.dentro ? root : document).querySelectorAll('*')]
            .filter(e => (e.textContent || '').trim() === it.texto).pop() || null
          // sobe ate um bloco com area, para a borda nao ficar colada na letra
          while (el && el.getBoundingClientRect().height < 16 && el.parentElement) el = el.parentElement
        }
        // 'ate': sobe ate o ancestral que casa o seletor (a linha inteira, por
        // exemplo) -- para quando o pai corta o elemento do texto por overflow
        // e a borda nao apareceria
        if (el && it.ate) el = el.closest(it.ate) || el
        if (!el) { r.push({ n: it.n, ok: false }); continue }
        // 'interna': a borda desenhada por dentro do elemento -- para a linha
        // de uma tabela que corta o que sai da propria caixa (overflow)
        el.classList.add('cap-marca'); if (it.interna) el.classList.add('cap-interna')
        const b = el.getBoundingClientRect()
        const num = document.createElement('div')
        num.className = 'cap-num'; num.textContent = String(it.n)
        num.style.left = Math.max(2, b.left + window.scrollX - 10) + 'px'
        num.style.top = Math.max(2, b.top + window.scrollY - 10) + 'px'
        document.body.appendChild(num)
        r.push({ n: it.n, ok: true })
      }
      return r
    }, { itens: cap.marcar ?? [], recorte: cap.recorte ? subst(cap.recorte) : null })
    const alvo = cap.recorte ? page.locator(subst(cap.recorte)).first() : page
    const arq = path.join(outDir, cap.arquivo)
    await alvo.screenshot({ path: arq, type: 'png' })
    feitos.push({ arquivo: cap.arquivo, marcados, bytes: fs.statSync(arq).size })
  }
  return feitos
}
