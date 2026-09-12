import { useRef } from 'react'

// T4 光源追赶：高光位置不再随手写，而是 rAF lerp 追鼠标——
// 从真实的全局进入边（CursorGlow 共享的 __cursorX/__cursorY）起步，
// hover 期间带重量感追赶；tilt 的 --rx/--ry 与高光同帧走同一条 rAF。
export default function TiltCard({ children }) {
  const ref = useRef(null)
  const rectRef = useRef(null)
  const rafRef = useRef(0)
  const targetRef = useRef({ px: 0.5, py: 0.5 })
  const curRef = useRef({ px: 0.5, py: 0.5 })

  const loop = () => {
    const el = ref.current
    if (!el) return
    const t = targetRef.current
    const c = curRef.current
    c.px += (t.px - c.px) * 0.22
    c.py += (t.py - c.py) * 0.22
    el.style.setProperty('--rx', `${((c.py - 0.5) * -7).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((c.px - 0.5) * 9).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(c.px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(c.py * 100).toFixed(1)}%`)
    rafRef.current = requestAnimationFrame(loop)
  }

  const onEnter = (e) => {
    rectRef.current = ref.current ? ref.current.getBoundingClientRect() : null
    // 光斑起点：全局鼠标真实位置（若 CursorGlow 未共享则用事件坐标），即"从进入边亮"
    const gx = window.__cursorX ?? e.clientX
    const gy = window.__cursorY ?? e.clientY
    const r = rectRef.current
    if (r) {
      curRef.current = { px: (gx - r.left) / r.width, py: (gy - r.top) / r.height }
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(loop)
  }

  const onMove = (e) => {
    const r = rectRef.current
    if (!r) return
    targetRef.current = {
      px: (e.clientX - r.left) / r.width,
      py: (e.clientY - r.top) / r.height,
    }
  }

  const onLeave = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
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
