// 分段截图脚本（仅本地验收用）：真实时钟滚动到每个区块，等视频 seek/解码后截图。
// 用法：先起 npm run preview -- --port 4177，再 node shots/capture.mjs
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
await page.goto(`${BASE}?static=1`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
// 预热：博客文章/旅行地图是异步加载的，页面高度会中途生长——
// 先滚到底再回顶，把所有懒加载/异步内容全部触发完再算落点
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await new Promise((r) => setTimeout(r, 2200))
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 1200))

// 8 个落点：hero + 6 区块 + footer。projects 取推轨跑道中段。
const stops = await page.evaluate(() => {
  const vh = window.innerHeight
  const abs = (el) => el.getBoundingClientRect().top + window.scrollY
  const gallery = document.querySelector('.gallery-space')
  const galleryY = gallery
    ? abs(gallery) + (gallery.offsetHeight - vh) * 0.45
    : abs(document.getElementById('projects'))
  const byId = (id) => {
    const el = document.getElementById(id)
    return el ? abs(el) : 0
  }
  return [
    { name: '01-hero', y: 0 },
    { name: '02-about', y: byId('about') - 60 },
    { name: '03-awards', y: byId('awards') - 60 },
    { name: '04-skills', y: byId('skills') - 60 },
    { name: '05-projects', y: galleryY },
    { name: '06-blog', y: byId('blog') - 60 },
    { name: '07-contact', y: byId('contact') - 60 },
    { name: '08-footer', y: document.documentElement.scrollHeight - vh },
  ]
})

for (const { name, y } of stops) {
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: 'instant' })
    // 同步派发一次 scroll，让 rAF 驱动的层立即对齐
    window.dispatchEvent(new Event('scroll'))
  }, Math.max(0, Math.round(y)))
  // 等 lerp 收敛 + 视频 seek/解码
  await new Promise((r) => setTimeout(r, 2600))
  // 画布桥：Edge 截图管线合成不了 <video> 层（headless/headful 均如此），
  // 把当前可见视频的真实当前帧画进 canvas、注入为固定背景层再截——
  // 帧内容即该滚动位置真实播放画面，仅存在于截图过程，页面代码零改动
  await page.evaluate(async () => {
    const v = [...document.querySelectorAll('.bg-video-layer')].find(
      (x) => x.dataset.visible === '1' && x.videoWidth > 0,
    )
    if (!v) return
    // 片头是 AI 素材的黑场淡入：seek 到片长 40% 的稳定亮帧再取帧
    const target = (v.duration || 10) * 0.4
    if (Math.abs(v.currentTime - target) > 0.05) {
      v.pause()
      v.currentTime = target
      await new Promise((res) => {
        const done = () => res(true)
        v.addEventListener('seeked', done, { once: true })
        setTimeout(done, 2500)
      })
    }
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    let d = document.getElementById('__shotbg')
    if (!d) {
      d = document.createElement('div')
      d.id = '__shotbg'
      d.style.cssText =
        'position:fixed;inset:0;z-index:-1;background-size:cover;background-position:center;pointer-events:none'
      document.body.appendChild(d)
    }
    d.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.88)})`
  })
  await new Promise((r) => setTimeout(r, 150))
  await page.screenshot({ path: `${OUT}${name}.png` })
  console.log(`shot ${name} @y=${Math.round(y)}`)
}

await browser.close()
