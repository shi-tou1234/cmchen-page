import { useEffect, useRef } from 'react'

// 前景视差粒子层（Canvas 2D，不引入 WebGL）：
// 慢速漂浮的微光点 + 近距离连线；每个粒子带独立视差系数，滚动时相对视频背景反向漂移，
// 与后景视频形成前/中/远三层纵深。读 window.__smoothY（App lerp 层），自重零依赖。
// 减少动效偏好下不渲染；颜色一次性采样 --accent-2，主题随章节切换时被滤镜统一偏色。
export default function ParticleField() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5)
    const LINK = 110 // 连线阈值（px）
    const N = Math.min(80, Math.max(36, Math.round(window.innerWidth / 24)))

    let w = 0
    let h = 0
    const particles = []
    let raf = 0

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * DPR
      canvas.height = h * DPR
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    const spawn = () => {
      particles.length = 0
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.12,
          r: 0.6 + Math.random() * 1.4,
          // 视差深度：小值贴视频（远景随层），大值贴内容（前景反向）——混合分布出体积感
          depth: 0.02 + Math.random() * 0.09,
        })
      }
    }

    const tint = () => {
      const c = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-2')
        .trim()
      return c || '#c9b998'
    }
    let color = tint()

    let colorTimer = window.setInterval(() => {
      color = tint()
    }, 4000)

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const smooth = Number.isFinite(window.__smoothY) ? window.__smoothY : 0
      ctx.clearRect(0, 0, w, h)

      // 视差后的绘制坐标预计算，连线判定用同一套坐标
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -20) p.x = w + 20
        else if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        else if (p.y > h + 20) p.y = -20
        p.dx = p.x
        p.dy = p.y - smooth * p.depth * 4 // 反向漂移，前景比视频层动得更多
      }

      ctx.fillStyle = color
      ctx.strokeStyle = color
      for (const p of particles) {
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.arc(p.dx, p.dy, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 0.12
      ctx.lineWidth = 0.6
      ctx.beginPath()
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const ddx = a.dx - b.dx
          const ddy = a.dy - b.dy
          if (ddx * ddx + ddy * ddy < LINK * LINK) {
            ctx.moveTo(a.dx, a.dy)
            ctx.lineTo(b.dx, b.dy)
          }
        }
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const onResize = () => {
      resize()
      spawn()
    }

    resize()
    spawn()
    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.clearInterval(colorTimer)
    }
  }, [])

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  return <canvas ref={ref} className="particle-field" aria-hidden="true" />
}
