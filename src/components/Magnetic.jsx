import { useRef } from 'react'

export default function Magnetic({ children }) {
  const ref = useRef(null)
  const rectRef = useRef(null)

  const onEnter = () => {
    rectRef.current = ref.current ? ref.current.getBoundingClientRect() : null
  }

  const onMove = (e) => {
    const el = ref.current
    const r = rectRef.current
    if (!el || !r) return
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`
  }

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div
      className="magnetic"
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}
