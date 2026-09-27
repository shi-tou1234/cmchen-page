// 边界承载截图（任务 2 验收用）：在 7 个区块边界的中点滚动位各拍一张，
// 并输出「交接元素在边界位 vs 静止位」的 transform/opacity 数值差——
// 数值差即承载的机器证据（活过边界、缩放可见），可见性由管理者/领导亲验。
// 用法：先起 npm run preview -- --port 4177，再 node shots/capture-boundary.mjs
import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://localhost:4177/cmchen-page/'
const OUT = 'shots/'

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: false,
  args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
  defaultViewport: { width: 1440, height: 900 },
})

const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 150)))
await page.goto(`${BASE}?static=1`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
// 预热：先滚到底再回顶，把懒加载/异步内容全部触发完再算落点（与 capture.mjs 同款）
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await new Promise((r) => setTimeout(r, 2200))
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 1200))

// 7 个边界：每对相邻区块，落点放在「下一区块头升到视口 55% 高度」处——
// 上一区块的收尾还在画面上缘，下一区块的交接元素正处入场半程
const stops = await page.evaluate(() => {
  const vh = window.innerHeight
  const abs = (el) => el.getBoundingClientRect().top + window.scrollY
  const pairs = [
    ['top', 'about'],
    ['about', 'awards'],
    ['awards', 'skills'],
    ['skills', 'projects'],
    ['projects', 'blog'],
    ['blog', 'contact'],
    ['contact', 'footer'],
  ]
  const footer = document.querySelector('.footer')
  // contact→footer 边界的承载元素在离场侧（contact 的 ghost 缩放淡出 + 相机推离）——
  // footer 是片尾卡，按 onetake 规则豁免入场承载
  return pairs.map(([prev, next]) => {
    const nextEl = next === 'footer' ? footer : document.getElementById(next)
    const raw = next === 'footer' ? abs(nextEl) + nextEl.offsetHeight * 0.2 - vh : abs(nextEl) - vh * 0.55
    const max = document.documentElement.scrollHeight - vh
    return {
      name: `b-${prev}-${next}`,
      prev,
      next,
      readId: next === 'footer' ? 'contact' : next,
      y: Math.max(0, Math.min(max, Math.round(raw))),
    }
  })
})

const evidence = []
for (const { name, readId, y } of stops) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await new Promise((r) => setTimeout(r, 1700)) // 等 lerp 收敛到目标位
  await page.screenshot({ path: `${OUT}${name}.png` })
  // 交接元素数值证据：承接侧区块的 ghost 与内容容器
  // 在「边界位」与「静止位」（区块头贴到页顶）各读一次 computed transform/opacity
  const ev = await page.evaluate((nextId) => {
    const read = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      return { transform: cs.transform, opacity: cs.opacity }
    }
    const ghost = document.querySelector(`#${nextId} .sec-ghost`)
    const cont = document.querySelector(`#${nextId} > .container`)
    return { ghost: read(ghost), container: read(cont) }
  }, readId)
  evidence.push({ boundary: name, y, next: readId, ...ev })
  console.log(`shot ${name} @y=${y}`)
}

// 静止位对照：每个区块头贴到页顶时再读一次（这是「归位」状态）
const readIds = [...new Set(stops.map((s) => s.readId))]
for (const next of readIds) {
  const y = await page.evaluate((nextId) => {
    const vh = window.innerHeight
    const abs = (el) => el.getBoundingClientRect().top + window.scrollY
    const el = nextId === 'footer' ? document.querySelector('.footer') : document.getElementById(nextId)
    const max = document.documentElement.scrollHeight - vh
    return Math.max(0, Math.min(max, Math.round(abs(el) - 80)))
  }, next)
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await new Promise((r) => setTimeout(r, 1700))
  const ev = await page.evaluate((nextId) => {
    const read = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      return { transform: cs.transform, opacity: cs.opacity }
    }
    const ghost = document.querySelector(`#${nextId} .sec-ghost`)
    const cont = document.querySelector(`#${nextId} > .container`)
    return { ghost: read(ghost), container: read(cont) }
  }, next)
  const item = evidence.find((e) => e.next === next)
  if (item) item.rest = ev
  console.log(`rest ${next} @y=${y}`)
}

console.log('\n=== 承载数值证据（边界位 vs 静止位）===')
for (const e of evidence) {
  const scaleOf = (t) => {
    if (!t || t === 'none') return 1
    const m = t.match(/matrix\(([-\d.eE]+),/)
    return m ? Number(m[1]) : null
  }
  const gB = scaleOf(e.ghost?.transform)
  const gR = scaleOf(e.rest?.ghost?.transform)
  const cB = scaleOf(e.container?.transform)
  const cR = scaleOf(e.rest?.container?.transform)
  console.log(
    `${e.boundary}: ghost scale ${gB} → ${gR} (Δ${gB !== null && gR !== null ? (gB - gR).toFixed(4) : 'n/a'})` +
      `, opacity ${e.ghost?.opacity} → ${e.rest?.ghost?.opacity}` +
      ` | camera scale ${cB} → ${cR}`
  )
}

await browser.close()
