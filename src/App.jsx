import { lazy, Suspense, useEffect, useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import StatsStrip from './components/StatsStrip'
import RuleReveal from './components/RuleReveal'
import About from './components/About'
import Awards from './components/Awards'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Blog from './components/Blog'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CursorGlow from './components/CursorGlow'
import NebulaBackground from './components/NebulaBackground'
import Preloader from './components/Preloader'
import Toast from './components/Toast'

const AdminApp = lazy(() => import('./admin/AdminApp'))

// hash 路由：#/admin 进入后台（GitHub Pages 静态托管无需 404 兜底）
function useIsAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(() =>
    window.location.hash.toLowerCase().startsWith('#/admin')
  )
  useEffect(() => {
    const on = () =>
      setIsAdmin(window.location.hash.toLowerCase().startsWith('#/admin'))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return isAdmin
}

// 色温映射：滚动经过不同区块时 accent 色相微妙偏移。参考站无彩色装饰，
// 旅程收窄为「暖奶油 → 暖沙 → 落日琥珀」的同族微差，保留机制不抢戏
const ACCENTS = {
  about: { a: '#e6ddcb', a2: '#d4c6ab' },
  awards: { a: '#e8dcc2', a2: '#cdb992' },
  skills: { a: '#e3d9c6', a2: '#c9b998' },
  projects: { a: '#e6dcc8', a2: '#c9b998' },
  blog: { a: '#e3d9c6', a2: '#cdb992' },
  contact: { a: '#e8c9a4', a2: '#dfa878' },
}
const ACCENT_DEFAULT = { a: '#e3d9c6', a2: '#c9b998' }

export default function App() {
  const isAdmin = useIsAdminRoute()

  // 共享 scroll handler：平滑 lerp 层 + ghost 视差 + 色温切换
  useEffect(() => {
    if (isAdmin) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ghosts = [...document.querySelectorAll('.sec-ghost')]
    const sectionIds = ['about', 'awards', 'skills', 'projects', 'blog', 'contact']
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    // 色温：IntersectionObserver 判断当前区块中心是否在视口中线
    let lastA = ''
    const setAccent = (c) => {
      const root = document.documentElement
      root.style.setProperty('--accent', c.a)
      root.style.setProperty('--accent-2', c.a2)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id !== lastA) {
            lastA = e.target.id
            setAccent(ACCENTS[e.target.id] || ACCENT_DEFAULT)
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    sections.forEach((s) => observer.observe(s))

    // 平滑滚动 lerp 层：所有滚动驱动效果共享同一个有"重量感"的插值源
    // 原生 scroll 瞬时到位，currentY 每帧 lerp 追赶，组件读 window.__smoothY
    let targetY = window.scrollY
    let currentY = targetY
    let raf = 0

    // ghost 视差：每个 ghost 按各自 section 位置做相对漂移（±150px 限制，不会飞出区块）
    const ghostData = ghosts.map((g) => {
      const section = g.parentElement
      const sectionTop = section
        ? section.getBoundingClientRect().top + currentY
        : 0
      return { el: g, sectionTop }
    })

    // 星空→墨黑的滚动过渡：前几幕星空全亮，随滚动平滑压暗到编辑式黑底。
    // 读 lerp 值（currentY）驱动，过渡自带"重量感"；只在变化时写样式。
    // 哨兵初值必须是有效数字——用 NaN 会让 Math.abs(x-NaN)>阈值 恒为 false，永不写入
    const bgCanvas = document.querySelector('.bg-canvas')
    let bgOpWritten = 1

    const onScrollRaw = () => {
      targetY = window.scrollY
    }

    let velSm = 0
    let velWritten = 0

    const loop = () => {
      const prevY = currentY
      currentY += (targetY - currentY) * 0.1
      window.__smoothY = currentY
      // 速度信号：帧间平滑位移（lerp 本身已有重量感，再叠一层轻平滑防抖），
      // clamp 后写给 CSS 变量供速度反应效果消费（跑马灯斜切）；值未变则不写样式
      const rawVel = Math.max(-48, Math.min(48, currentY - prevY))
      velSm += (rawVel - velSm) * 0.15
      if (Math.abs(velSm - velWritten) > 0.1) {
        document.documentElement.style.setProperty('--scroll-vel', velSm.toFixed(1))
        velWritten = velSm
      }
      if (bgCanvas) {
        // 参考站式滚轮响应加强版：smoothstep 缓动 + 下沉 + 放大 + 微旋转 + 压暗
        // 四重变化同时进行，跑道后半段变化最剧烈（前段蓄势、后段俯冲）。
        // 旋转 2° 的角位移约 30px，被 1.38 倍缩放裕量完全覆盖，不露画布边缘
        const vh = window.innerHeight
        const raw = Math.min(1, currentY / (vh * 1.6))
        const t = raw * raw * (3 - 2 * raw) // smoothstep：两端慢、中段快
        const op = 1 - t * 0.52
        const drift = t * vh * 0.16
        const zoom = 1 + t * 0.38
        const rot = t * 2
        if (Math.abs(op - bgOpWritten) > 0.004) {
          bgCanvas.style.opacity = op.toFixed(3)
          bgCanvas.style.transform = `translate3d(0, ${drift.toFixed(1)}px, 0) scale(${zoom.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`
          bgOpWritten = op
        }
      }
      ghostData.forEach(({ el, sectionTop }) => {
        const relative = currentY - sectionTop
        const offset = Math.max(-150, Math.min(150, relative * -0.06))
        el.style.transform = `translateY(${offset.toFixed(1)}px)`
      })
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('scroll', onScrollRaw, { passive: true })
    // 后台标签 rAF 被节流会让 lerp 冻结在旧位置；回到前台时直接对齐真实滚动位置，
    // 避免内容带着「历史进度」慢速追赶一秒
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        targetY = window.scrollY
        currentY = targetY
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    raf = requestAnimationFrame(loop)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScrollRaw)
      document.removeEventListener('visibilitychange', onVisible)
      cancelAnimationFrame(raf)
      setAccent(ACCENT_DEFAULT)
      window.__smoothY = 0
    }
  }, [isAdmin])

  if (isAdmin) {
    return (
      <Suspense fallback={<div className="admin-loading">正在加载后台…</div>}>
        <AdminApp />
      </Suspense>
    )
  }

  return (
    <>
      <Preloader />
      <NebulaBackground />
      <div className="page-grid" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <CursorGlow />
      <Nav />
      <main>
        <Hero />
        <RuleReveal />
        <Marquee />
        <StatsStrip />
        <RuleReveal />
        <About />
        <RuleReveal />
        <Awards />
        <RuleReveal />
        <Skills />
        <RuleReveal />
        <Projects />
        <RuleReveal />
        <Blog />
      </main>
      <Contact />
      <Footer />
      <Toast />
    </>
  )
}
