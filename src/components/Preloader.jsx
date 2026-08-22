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

    const timer = setTimeout(finish, 1150)
    return () => clearTimeout(timer)
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
