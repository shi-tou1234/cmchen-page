import { useEffect, useState } from 'react'

// 开场加载遮罩：掩盖 shader 编译卡顿，结束后给 body 加 site-revealed 触发 Hero 进场编排
let hasShownThisLoad = false

export default function Preloader() {
  const [done, setDone] = useState(hasShownThisLoad)

  useEffect(() => {
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

    // 最短展示 900ms；字体就绪即放行，最多等 2.5s 兜底，慢网络下避免遮罩放行后内容跳变
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
    Promise.all([
      wait(900),
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
        cmchen<span>.</span>
      </div>
      <div className="preloader-bar">
        <i />
      </div>
    </div>
  )
}
