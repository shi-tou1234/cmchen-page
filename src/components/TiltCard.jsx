import { useRef } from 'react'

export default function TiltCard({ children }) {
  const ref = useRef(null)
  const rectRef = useRef(null)

  const onEnter = () => {
    rectRef.current = ref.current ? ref.current.getBoundingClientRect() : null
  }

  const onMove = (e) => {
    const r = rectRef.current
    if (!r) return
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', `${((py - 0.5) * -7).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      className="tilt"
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}
