import { useEffect, useRef, useState } from 'react'

export default function Typewriter({ text, speed = 70 }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // 副本的排版更像文章导语，打字节奏比原版快一些。
    const copyMode = !!el.closest('.copy-page')
    const interval = copyMode ? Math.max(34, Math.round(speed * 0.62)) : speed
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect()
          if (reduced) {
            setN(text.length)
            return
          }
          if (startedRef.current) return
          startedRef.current = true
          let i = 0
          const timer = setInterval(() => {
            i += 1
            setN(i)
            if (i >= text.length) clearInterval(timer)
          }, interval)
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [text, speed])

  return (
    <span ref={ref}>
      {text.slice(0, n)}
      <span className={`type-caret${n >= text.length ? ' type-caret-done' : ''}`} />
    </span>
  )
}
