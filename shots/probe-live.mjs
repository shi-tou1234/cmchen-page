import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: false,
  args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 150)))
await page.goto('https://shi-tou1234.github.io/cmchen-page/', {
  waitUntil: 'networkidle2',
  timeout: 90000,
})
await new Promise((r) => setTimeout(r, 6000))

const info = await page.evaluate(() => {
  const v = document.querySelector('.bg-video-layer')
  return {
    version: document.querySelector('.work-grid') ? 'NEW' : document.querySelector('.gallery-track') ? 'OLD' : 'unknown',
    videos: [...document.querySelectorAll('.bg-video-layer')].map((x) => ({
      c: x.dataset.clip,
      paused: x.paused,
      rs: x.readyState,
      t: +x.currentTime.toFixed(2),
      net: x.networkState,
      err: x.error ? x.error.code : null,
      op: x.style.opacity,
      vis: x.dataset.visible ?? 'unset',
    })),
    firstVideoSrc: v ? v.currentSrc.slice(-30) : null,
  }
})
console.log(JSON.stringify(info, null, 1))

// 再等 6 秒看播放头是否前进
await new Promise((r) => setTimeout(r, 6000))
const t2 = await page.evaluate(() =>
  [...document.querySelectorAll('.bg-video-layer')].map((x) => ({
    c: x.dataset.clip,
    paused: x.paused,
    t: +x.currentTime.toFixed(2),
  })),
)
console.log('6s 后：', JSON.stringify(t2))
await browser.close()
