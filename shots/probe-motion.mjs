// 任务 3 取证：① prefers-reduced-motion 下运镜/ghost 全部不写 inline transform
// ② 正常模式滚动 10s 的 rAF 帧间隔采样（均值/p95，判断有无持续掉帧）
import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://localhost:4177/cmchen-page/'

// ---- ① reduced-motion ----
{
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: false,
    args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(`${BASE}`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await new Promise((r) => setTimeout(r, 1500))
  await page.evaluate(() => window.scrollTo(0, 2400))
  await new Promise((r) => setTimeout(r, 1200))
  const reduced = await page.evaluate(() => {
    const dirty = []
    document.querySelectorAll('.sec-ghost').forEach((g) => {
      if (g.style.transform || g.style.opacity) dirty.push(`ghost:${g.textContent}`)
    })
    document
      .querySelectorAll('.section > .container, .stats-strip > .container, .marquee, .contact > .container, .footer > .container')
      .forEach((el, i) => {
        if (el.style.transform || el.style.willChange) dirty.push(`cam#${i}`)
      })
    return { dirty, y: window.scrollY }
  })
  console.log('[reduced-motion] 脏写入:', JSON.stringify(reduced))
  await browser.close()
}

// ---- ② 10s 滚动帧率采样 ----
{
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: false,
    args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  await page.goto(`${BASE}?static=1`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await new Promise((r) => setTimeout(r, 2000))
  const stats = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const deltas = []
        let last = performance.now()
        let frames = 0
        const tick = (now) => {
          deltas.push(now - last)
          last = now
          frames++
          if (frames % 6 === 0) {
            // 模拟持续滚动：来回扫全页
            const max = document.documentElement.scrollHeight - innerHeight
            const t = (frames / 360) % 2
            window.scrollTo(0, Math.round(t < 1 ? max * t : max * (2 - t)))
          }
          if (frames < 360 * 2) requestAnimationFrame(tick)
          else {
            deltas.sort((a, b) => a - b)
            const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length
            resolve({
              frames: deltas.length,
              avgMs: +avg.toFixed(2),
              p95Ms: +deltas[Math.floor(deltas.length * 0.95)].toFixed(2),
              maxMs: +deltas[deltas.length - 1].toFixed(2),
            })
          }
        }
        requestAnimationFrame(tick)
      })
  )
  console.log('[frame-stats] 10s 滚动采样:', JSON.stringify(stats))
  await browser.close()
}
