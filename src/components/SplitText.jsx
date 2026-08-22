import { useEffect, useRef, useState } from 'react'

export default function SplitText({ text, className = '' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <span ref={ref} className={`split${on ? ' split-on' : ''} ${className}`} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span className="split-m" key={i} aria-hidden="true">
          <span className="split-c" style={{ transitionDelay: `${i * 42}ms` }}>
            {ch}
          </span>
        </span>
      ))}
    </span>
  )
}
