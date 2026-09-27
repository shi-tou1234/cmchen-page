// 验证背景轨道覆盖分配：滚到各区块中点/页脚，读当前主导视频（opacity 最高）
// 与是否处于溶解窗（veil > 0）。预期：about=snow，skills=projects=moon-river，
// blog(含地图)=galaxy，contact=footer=night-stream。
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
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 120)))
await page.goto(`${BASE}?static=1`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await new Promise((r) => setTimeout(r, 2200))
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 1000))

const stops = await page.evaluate(() => {
  const abs = (id) =>
    document.getElementById(id).getBoundingClientRect().top + window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  return [
    { name: 'hero', y: 0 },
    { name: 'about', y: abs('about') },
    { name: 'awards', y: abs('awards') },
    { name: 'skills', y: abs('skills') },
    { name: 'projects(mid)', y: (abs('projects') + abs('blog')) / 2 },
    { name: 'blog(mid)', y: abs('blog') + 400 },
    { name: 'blog/map区', y: (abs('contact') + abs('blog')) / 2 - 200 },
    { name: 'contact', y: abs('contact') },
    { name: 'footer', y: max },
  ].map((s) => ({ ...s, y: Math.max(0, Math.min(max, Math.round(s.y))) }))
})

for (const { name, y } of stops) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await new Promise((r) => setTimeout(r, 1800))
  const state = await page.evaluate(() => {
    const vids = [...document.querySelectorAll('.bg-video-layer')]
    const lead = vids
      .slice()
      .sort(
        (a, b) => parseFloat(b.style.opacity || '0') - parseFloat(a.style.opacity || '0')
      )[0]
    const veil = document.querySelector('.bg-transition-veil')
    return {
      lead: lead
        ? `${lead.dataset.clip}(${parseFloat(lead.style.opacity || '0').toFixed(2)})`
        : '?',
      veil: veil ? parseFloat(veil.style.opacity || '0').toFixed(3) : '0',
      y: Math.round(window.scrollY),
    }
  })
  console.log(`${name.padEnd(12)} → ${state.lead}  veil=${state.veil}  @y=${state.y}`)
}
await browser.close()
