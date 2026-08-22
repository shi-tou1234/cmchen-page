import { useEffect, useRef, useState } from 'react'

export default function Typewriter({ text, speed = 70 }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
          }, speed)
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
