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

    const onScrollRaw = () => {
      targetY = window.scrollY
    }

    let velSm = 0
    let velWritten = NaN

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
      ghostData.forEach(({ el, sectionTop }) => {
        const relative = currentY - sectionTop
        const offset = Math.max(-150, Math.min(150, relative * -0.06))
        el.style.transform = `translateY(${offset.toFixed(1)}px)`
      })
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('scroll', onScrollRaw, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScrollRaw)
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
