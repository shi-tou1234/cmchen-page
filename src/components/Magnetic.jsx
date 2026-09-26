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
    const copy = el.closest('.copy-page')
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    // 副本的磁吸更克制，文字保持编辑感，不会被按钮甩出栅格。
    el.style.transform = copy
      ? `translate(${dx * 0.08}px, ${dy * 0.14}px)`
      : `translate(${dx * 0.18}px, ${dy * 0.3}px)`
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
