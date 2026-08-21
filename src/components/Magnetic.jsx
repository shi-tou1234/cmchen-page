import { useRef } from 'react'

export default function Magnetic({ children }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`
  }

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div className="magnetic" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}
