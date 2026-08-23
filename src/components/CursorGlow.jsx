import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const dotRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const dot = dotRef.current
    const glow = glowRef.current
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let gx = x
    let gy = y
    let visible = false
    let raf = 0

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      visible = true
      dot.style.opacity = '1'
      glow.style.opacity = '1'
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onLeave = () => {
      visible = false
      dot.style.opacity = '0'
      glow.style.opacity = '0'
    }

    const loop = () => {
      gx += (x - gx) * 0.08
      gy += (y - gy) * 0.08
      dot.style.transform = `translate(${x}px, ${y}px)`
      glow.style.transform = `translate(${gx}px, ${gy}px)`
      // 已隐藏且拖尾追上鼠标：空闲自停，省掉常驻 rAF
      if (!visible && Math.abs(x - gx) < 0.5 && Math.abs(y - gy) < 0.5) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
    </>
  )
}
