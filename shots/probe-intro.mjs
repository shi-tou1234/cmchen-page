// 验证「每次刷新都播开场编排」：同一浏览器会话连续两次整页加载，
// 两次都必须看到 .preloader（幕布），且加载完成后揭幕＋无 sessionStorage 跳过标记
import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://localhost:4177/cmchen-page/'

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: false,
  args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
for (let i = 1; i <= 2; i += 1) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  const early = await page.evaluate(() => ({
    preloaderInDom: !!document.querySelector('.preloader'),
    revealed: document.body.classList.contains('site-revealed'),
    sessionFlag: sessionStorage.getItem('cmchen-page:preloaded'),
  }))
  await new Promise((r) => setTimeout(r, 3000))
  const late = await page.evaluate(() => ({
    revealed: document.body.classList.contains('site-revealed'),
    preloaderGone: !document.querySelector('.preloader'),
  }))
  console.log(`第 ${i} 次刷新:`, JSON.stringify({ early, late }))
}
await browser.close()
