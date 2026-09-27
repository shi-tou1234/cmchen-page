// 背景「抽搐」A/B 取证：idle 自动播放把播放头推前，滚轮唤醒刮擦映射时
// 旧代码会把播放头瞬间拽回映射位置（回跳 = 抽搐）。
// 探针流程：滚到 about 段 → 静止 2.6s（idle 播放起步）→ 三手势下滚
// （每手势间隔 900ms > 650ms 静止窗口，强制触发 播放→唤醒 循环），
// 全程逐帧采样同一视频的 currentTime，统计「非倒滚引起的回跳」次数与幅度。
import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.argv[2] || 'http://localhost:4177/cmchen-page/'

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: false,
  args: ['--no-first-run', '--mute-audio', '--window-position=2600,0'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 120)))
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4500)) // preloader 揭幕

await page.evaluate(() => window.scrollTo(0, 2077))
await new Promise((r) => setTimeout(r, 2600)) // idle > 650ms：播放头前进

// 三手势滚动 + 逐帧采样（在手势间隙里播放头继续前进）
const result = await page.evaluate(
  () =>
    new Promise((resolve) => {
      // 只盯当前可见的那一条视频：data-visible='1' 且 opacity 最高
      const pick = () => {
        const vids = [...document.querySelectorAll('.bg-video-layer')]
        return vids
          .filter((v) => v.style.visibility !== 'hidden')
          .sort(
            (a, b) =>
              parseFloat(b.style.opacity || '1') - parseFloat(a.style.opacity || '1')
          )[0]
      }
      const samples = []
      let raf = 0
      let timer = 0
      const t0 = performance.now()
      const tick = () => {
        const vis = pick()
        samples.push({
          t: performance.now() - t0,
          clip: vis ? vis.dataset.clip : '?',
          ct: vis ? vis.currentTime : -1,
          paused: vis ? vis.paused : null,
          seeking: vis ? vis.seeking : null,
          y: window.scrollY,
        })
        if (performance.now() - t0 < 6200) raf = requestAnimationFrame(tick)
        else resolve(samples)
      }
      raf = requestAnimationFrame(tick)

      // 三手势：每手势 8 步 × 45px、步距 110ms；手势间隔 900ms（> 650ms 静止窗口）
      const gesture = () => {
        let inner = 0
        timer = setInterval(() => {
          inner += 1
          window.scrollBy(0, 45)
          if (inner >= 8) {
            clearInterval(timer)
            gestures += 1
            if (gestures < 3) setTimeout(gesture, 900)
          }
        }, 110)
      }
      let gestures = 0
      gesture()
    })
)

// 统计回跳：固定盯同一条 clip（数据里取占比最高的），手势只向下滚，
// 纯映射应单调前进；ct 下降超过 0.12s 即为一次回跳（抽搐）
const byClip = new Map()
for (const s of result) {
  if (!byClip.has(s.clip)) byClip.set(s.clip, [])
  byClip.get(s.clip).push(s)
}
let best = { clip: '?', jumps: 0, maxJump: 0, frames: 0 }
for (const [clip, list] of byClip) {
  if (list.length > best.frames) best = { clip, frames: list.length, list }
}
let jumps = 0
let maxJump = 0
const contexts = []
for (let i = 1; i < best.list.length; i += 1) {
  const d = best.list[i].ct - best.list[i - 1].ct
  if (d < -0.12) {
    jumps += 1
    maxJump = Math.max(maxJump, -d)
    contexts.push(best.list.slice(Math.max(0, i - 3), i + 3).map((s) => ({
      t: Math.round(s.t), clip: s.clip, ct: +s.ct.toFixed(2),
      paused: s.paused, seeking: s.seeking, y: Math.round(s.y),
    })))
  }
}
console.log(
  JSON.stringify(
    {
      watchedClip: best.clip,
      frames: best.frames,
      backwardJumps: jumps,
      maxJumpSec: +maxJump.toFixed(3),
      playingFrames: best.list.filter((s) => !s.paused).length,
      seekingFrames: best.list.filter((s) => s.seeking).length,
      contexts,
    },
    null,
    1
  )
)
await browser.close()
