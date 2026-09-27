import { useEffect, useRef, useState } from 'react'

// ease：入场曲线族（index.css 曲线三族）——snap 落地急停（默认）/
// spring 回弹 / settle 缓落。按 PROGRESS.md 节拍表逐区块分配，别全站一个手感
export default function Reveal({ children, delay = 0, variant = 'up', ease = 'snap' }) {
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
  const easeCls = ease !== 'snap' ? ` reveal-ease-${ease}` : ''

  return (
    <div
      ref={ref}
      className={`reveal${variantCls}${easeCls}${visible ? ' is-visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
