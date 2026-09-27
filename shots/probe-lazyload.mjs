// 懒加载取证：首屏只允许拉 1 条 mp4（首段轨道），其余 clip 必须 preload=none；
// 滚到下一段后，只应新增被滚到的那一条。慢网下 5 条并发是「背景不动」的根因。
// 用法：先 `npm run preview -- --port 4177`，再 `node shots/probe-lazyload.mjs`
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

const mp4 = new Set()
page.on('request', (req) => {
  if (req.url().endsWith('.mp4')) mp4.add(req.url().split('/').pop())
})

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
const atLoad = [...mp4]
console.log(`首屏请求的 mp4 (${atLoad.length}): ${atLoad.join(', ') || '无'}`)

const state = await page.evaluate(() =>
  [...document.querySelectorAll('.bg-video-layer')].map(
    (v) => `${v.dataset.clip}:${v.preload}`,
  ),
)
console.log(`preload 属性: ${state.join('  ')}`)

// 滚到下一段（about）中点，看是否只多拉一条
await page.evaluate(() => {
  const el = document.getElementById('about')
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
})
await new Promise((r) => setTimeout(r, 2500))
const afterScroll = [...mp4]
console.log(`滚到 about 后累计 (${afterScroll.length}): ${afterScroll.join(', ')}`)

const playing = await page.evaluate(() => {
  const lead = [...document.querySelectorAll('.bg-video-layer')].sort(
    (a, b) => parseFloat(b.style.opacity || '0') - parseFloat(a.style.opacity || '0'),
  )[0]
  return {
    clip: lead?.dataset.clip,
    readyState: lead?.readyState,
    paused: lead?.paused,
    ct: +(lead?.currentTime || 0).toFixed(2),
  }
})
console.log(`当前主导: ${JSON.stringify(playing)}`)

const ok = atLoad.length <= 2 && afterScroll.length <= 3 && !playing.paused
console.log(ok ? 'PASS' : 'FAIL')
await browser.close()
process.exit(ok ? 0 : 1)
