import { useEffect, useRef, useState } from 'react'

export default function Reveal({ children, delay = 0, variant = 'up' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // clip-up 用 threshold: 0——clip-path 把视觉高度裁成 0，threshold 0.12 永远达不到
    const threshold = variant === 'clip-up' ? 0 : 0.12
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [variant])

  const variantCls = variant !== 'up' ? ` reveal--${variant}` : ''

  return (
    <div
      ref={ref}
      className={`reveal${variantCls}${visible ? ' is-visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
