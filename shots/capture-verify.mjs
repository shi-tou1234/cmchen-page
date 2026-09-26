import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: false,
  args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
  defaultViewport: { width: 847, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:4177/cmchen-page/?static=1', {
  waitUntil: 'networkidle2',
  timeout: 60000,
})
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await new Promise((r) => setTimeout(r, 2200))
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 1000))

const stops = await page.evaluate(() => {
  const abs = (el) => el.getBoundingClientRect().top + window.scrollY
  return [
    { name: '_v-hero', y: 0 },
    { name: '_v-projects', y: abs(document.getElementById('projects')) - 40 },
    { name: '_v-projects2', y: abs(document.getElementById('projects')) + 560 },
    { name: '_v-blog', y: abs(document.querySelector('.travel-block')) - 180 },
    { name: '_v-contact', y: abs(document.getElementById('contact')) + 60 },
  ]
})
for (const { name, y } of stops) {
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: 'instant' })
    window.dispatchEvent(new Event('scroll'))
  }, Math.max(0, Math.round(y)))
  await new Promise((r) => setTimeout(r, 2200))
  await page.evaluate(() => {
    const v = [...document.querySelectorAll('.bg-video-layer')].find(
      (x) => x.dataset.visible === '1' && x.videoWidth > 0,
    )
    if (!v) return
    const target = (v.duration || 10) * 0.4
    if (Math.abs(v.currentTime - target) > 0.05) {
      v.pause()
      v.currentTime = target
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
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: `shots/${name}.png` })
  console.log(`shot ${name} @y=${Math.round(y)}`)
}
await browser.close()
