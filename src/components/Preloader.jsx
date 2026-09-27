import { useEffect, useState } from 'react'

// 开场加载遮罩：4 阶段电影编排（逐字打出 → 发光脉冲 → 副标题 → 揭幕）
// 领导拍板：每次刷新都完整播放（2026-09-27，去掉原 sessionStorage 跳过记忆）。
// hasShownThisLoad 只防 React 重挂载导致同一次加载里重复开演；整页刷新会归零。
// 减少动效环境秒进。
let hasShownThisLoad = false

const LOGO = 'cmchen'

// ?static=1：截图/调试钩子——跳过开场编排，冻结全部动画直出终态
const STATIC_MODE = (() => {
  try {
    return new URLSearchParams(window.location.search).has('static')
  } catch {
    return false
  }
})()

export default function Preloader() {
  const [done, setDone] = useState(() => STATIC_MODE || hasShownThisLoad)

  useEffect(() => {
    if (STATIC_MODE) {
      document.body.classList.add('site-revealed', 'is-static')
      // ?y=1234：静态模式下瞬时滚到指定位置，供分段截图/调试
      const y = Number(new URLSearchParams(window.location.search).get('y'))
      if (Number.isFinite(y) && y > 0) {
        const jump = () => window.scrollTo({ top: y, behavior: 'instant' })
        requestAnimationFrame(jump)
        document.fonts?.ready.then(jump).catch(() => {})
      }
      return
    }
    if (done) {
      document.body.classList.add('site-revealed')
      return
    }
    hasShownThisLoad = true

    const finish = () => {
      document.body.classList.add('site-revealed')
      setDone(true)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }

    const timers = []
    const wait = (ms) =>
      new Promise((resolve) => {
        const t = setTimeout(resolve, ms)
        timers.push(t)
      })
    let finished = false
    const finishOnce = () => {
      if (!finished) {
        finished = true
        finish()
      }
    }

    // 2.2s 最短展示（编排全程），字体就绪即放行，最多 2.5s 兜底
    Promise.all([
      wait(2200),
      Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        wait(2500),
      ]),
    ]).then(finishOnce)

    return () => timers.forEach(clearTimeout)
  }, [done])

  if (done) return null

  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader-logo">
        {LOGO.split('').map((ch, i) => (
          <span
            key={i}
            className="preloader-char"
            style={{ '--d': `${i * 80}ms` }}
          >
            {ch}
          </span>
        ))}
        <span
          className="preloader-char preloader-dot"
          style={{ '--d': `${LOGO.length * 80 + 40}ms` }}
        >
          .
        </span>
      </div>
      <div className="preloader-sub">FOLIO / 26</div>
    </div>
  )
}
