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
  .cap-num { position: absolute; z-index: 99999; background: #e4572e; color: #fff; font: bold 14px/22px sans-serif;
             width: 22px; height: 22px; border-radius: 50%; text-align: center; box-shadow: 0 0 0 2px #fff; pointer-events: none; }
`

async function loginOpenShift(page) {
  // a console redireciona para o OAuth; o formulario htpasswd tem username/password
  const user = page.locator('input[name="username"]')
  if (await user.count() === 0) return false
  await user.fill(env.usuario_console)
  await page.locator('input[name="password"]').fill(env.senha_console)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForLoadState('domcontentloaded')
  return true
}

export default async function run(page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  const feitos = []
  for (const cap of spec) {
    await page.goto(subst(cap.url), { waitUntil: 'domcontentloaded', timeout: 90000 })
    if (cap.login === 'openshift') {
      await page.waitForTimeout(1500)
      if (await loginOpenShift(page)) await page.goto(subst(cap.url), { waitUntil: 'domcontentloaded', timeout: 90000 })
    }
    for (const sel of cap.esperar ?? []) await page.locator(subst(sel)).first().waitFor({ timeout: 90000 })
    if (cap.pausa) await page.waitForTimeout(cap.pausa)
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
          // sobe ate um bloco com area, para a borda nao ficar colada na letra
          while (el && el.getBoundingClientRect().height < 16 && el.parentElement) el = el.parentElement
        }
        if (!el) { r.push({ n: it.n, ok: false }); continue }
        el.classList.add('cap-marca')
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
