import { useEffect, useState } from 'react'

// 开场加载遮罩：4 阶段电影编排（逐字打出 → 发光脉冲 → 副标题 → 揭幕）
// 同一会话刷新跳过（sessionStorage 记忆）；减少动效环境秒进
let hasShownThisLoad = false

const SEEN_KEY = 'cmchen-page:preloaded'
const LOGO = 'cmchen'

function seenThisSession() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* 隐私模式等写入失败可忽略 */
  }
}

export default function Preloader() {
  const [done, setDone] = useState(hasShownThisLoad || seenThisSession())

  useEffect(() => {
    if (done) {
      document.body.classList.add('site-revealed')
      return
    }
    hasShownThisLoad = true
    markSeen()

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
