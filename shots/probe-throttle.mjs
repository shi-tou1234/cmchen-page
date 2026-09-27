import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: false,
  args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
// 模拟慢速网络：~400KB/s，让视频首帧远晚于 650ms 静止窗口
const cdp = await page.createCDPSession()
await cdp.send('Network.enable')
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 200,
  downloadThroughput: 400 * 1024,
  uploadThroughput: 200 * 1024,
})
await page.goto('http://localhost:4177/cmchen-page/', {
  waitUntil: 'domcontentloaded',
  timeout: 90000,
})
// 等 25 秒（远超静止窗口），期间不滚动
await new Promise((r) => setTimeout(r, 25000))
const st = await page.evaluate(() => {
  const v = [...document.querySelectorAll('.bg-video-layer')].find(
    (x) => x.dataset.clip === 'starfield',
  )
  return { paused: v.paused, t: +v.currentTime.toFixed(2), rs: v.readyState }
})
console.log('慢网 25s 后 starfield：', JSON.stringify(st))
console.log(st.paused === false && st.t > 0.1 ? 'PASS: 播放闸门在数据到位后生效' : 'FAIL: 仍然冻结')
await browser.close()
