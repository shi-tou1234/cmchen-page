import { useEffect, useRef } from 'react'

// 自定义光标：白点即时跟随 + 细环滞后追踪（悬停可交互元素时环放大点亮）
// 仅精确指针设备启用；触屏 / 减少动效环境下由 CSS 整体隐藏，保留系统光标
export default function CursorGlow() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    // 仅在光标组件实际挂载时隐藏系统箭头；#/admin 路由没有本组件，不受影响
    document.body.classList.add('custom-cursor-on')
    const dot = dotRef.current
    const ring = ringRef.current
    const glow = glowRef.current
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let gx = x
    let gy = y
    let scale = 1
    let hot = false
    let down = false
    let visible = false
    let raf = 0

    const HOT = 'a, button, input, textarea, select, label, [role="button"], .skill-row, .fact-row, .post'

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      visible = true
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onOver = (e) => {
      hot = !!(e.target && e.target.closest && e.target.closest(HOT))
      ring.classList.toggle('is-active', hot)
    }
    const onDown = () => {
      down = true
    }
    const onUp = () => {
      down = false
    }
    const onLeave = () => {
      visible = false
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      glow.style.opacity = '0'
    }

    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      gx += (x - gx) * 0.08
      gy += (y - gy) * 0.08
      const target = down ? 0.75 : hot ? 1.6 : 1
      scale += (target - scale) * 0.2
      dot.style.transform = `translate(${x}px, ${y}px)`
      ring.style.transform = `translate(${rx}px, ${ry}px) scale(${scale.toFixed(3)})`
      glow.style.transform = `translate(${gx}px, ${gy}px)`
      // 已隐藏且拖尾追上鼠标：空闲自停，省掉常驻 rAF
      if (!visible && Math.abs(x - rx) < 0.5 && Math.abs(y - ry) < 0.5) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      document.body.classList.remove('custom-cursor-on')
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
    </>
  )
}
