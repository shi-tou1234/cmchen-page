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
import VideoBackground from './components/VideoBackground'
import ParticleField from './components/ParticleField'
import Preloader from './components/Preloader'
import Toast from './components/Toast'
import CopyModeExit from './components/CopyModeExit'

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

// #/copy 只作为文字排版副本入口。进入副本后，普通栏目锚点不会把它切回原版；
// 点击“返回原版”或回到 #top 时退出副本。sessionStorage 让刷新后的 #about 仍保留副本模式。
function useIsCopyRoute() {
  const [isCopy, setIsCopy] = useState(() => {
    const hash = window.location.hash.toLowerCase()
    if (hash.startsWith('#/copy')) {
      try {
        sessionStorage.setItem('cmchen-page:copy-mode', '1')
      } catch {
        // 隐私模式下仍可直接使用当前会话，不影响路由本身。
      }
      return true
    }
    if (hash === '' || hash === '#/' || hash === '#top') {
      try {
        sessionStorage.removeItem('cmchen-page:copy-mode')
      } catch {
        // 忽略存储不可用。
      }
      return false
    }
    try {
      return sessionStorage.getItem('cmchen-page:copy-mode') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    const on = () => {
      const hash = window.location.hash.toLowerCase()
      if (hash.startsWith('#/copy')) {
        try {
          sessionStorage.setItem('cmchen-page:copy-mode', '1')
        } catch {
          // 忽略存储不可用。
        }
        setIsCopy(true)
      } else if (hash === '' || hash === '#/' || hash === '#top') {
        try {
          sessionStorage.removeItem('cmchen-page:copy-mode')
        } catch {
          // 忽略存储不可用。
        }
        setIsCopy(false)
      }
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return isCopy
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

// 章节滤镜编表（T2）：视频层 hue 随当前区块偏移——暖沙底主题嘛，
// 变化刻意克制（±10deg），叠加 blur 惯性后与视频层 p/p 同帧合成。
const HUES = { top: 0, about: 6, awards: -5, skills: 4, projects: 0, blog: -6, contact: 10 }

export default function App() {
  const isAdmin = useIsAdminRoute()
  const isCopy = useIsCopyRoute()

  // 共享 scroll handler：平滑 lerp 层 + ghost 视差 + 色温切换
  useEffect(() => {
    if (isAdmin) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ghosts = [...document.querySelectorAll('.sec-ghost')]
    const sectionIds = ['top', 'about', 'awards', 'skills', 'projects', 'blog', 'contact']
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    // 色温：IntersectionObserver 判断当前区块中心是否在视口中线
    let lastA = ''
    const setAccent = (c, id) => {
      const root = document.documentElement
      root.style.setProperty('--accent', c.a)
      root.style.setProperty('--accent-2', c.a2)
      // 章节滤镜目标：App loop 将 hueSm lerp 追赶本值，与滚动 blur 同帧合成
      window.__targetHue = HUES[id] ?? 0
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id !== lastA) {
            lastA = e.target.id
            setAccent(
              ACCENTS[e.target.id] || ACCENT_DEFAULT,
              e.target.id
            )
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

    // 星空→可读夜景的滚动过渡：保留视频细节，只做轻微压暗，避免背景吞掉栏目内容。
    // 读 lerp 值（currentY）驱动，过渡自带"重量感"；只在变化时写样式。
    // 哨兵初值必须是有效数字——用 NaN 会让 Math.abs(x-NaN)>阈值 恒为 false，永不写入
    const bgCanvas = document.querySelector('.bg-canvas')
    let bgOpWritten = 1

    const onScrollRaw = () => {
      targetY = window.scrollY
    }

    let velSm = 0
    let velWritten = 0
    // T2 章节 hue / T3 惯性 blur：与 velSm 同帧平滑，合成一条 filter 写入
    let hueSm = 0
    let blurSm = 0
    let filterWritten = ''

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
        // 滚轮响应：smoothstep 缓动 + 下沉 + 轻微放大 + 压暗。
        // 放大上限从 0.28 收到 0.10、微旋转整条去掉——非整数倍放大叠旋转会逼着
        // 每一帧重采样，暗部夜空那种高频颗粒会被放大成一层「脏沙」，
        // 清晰度就是这么掉的。0.10 的余量只够盖住下沉位移，不产生重采样压力。
        const vh = window.innerHeight
        const raw = Math.min(1, currentY / (vh * 1.6))
        const t = raw * raw * (3 - 2 * raw) // smoothstep：两端慢、中段快
        const op = 1 - t * 0.2
        const drift = t * vh * 0.1
        const zoom = 1 + t * 0.1
        if (Math.abs(op - bgOpWritten) > 0.004) {
          bgCanvas.style.opacity = op.toFixed(3)
          bgCanvas.style.transform = `translate3d(0, ${drift.toFixed(1)}px, 0) scale(${zoom.toFixed(4)})`
          bgOpWritten = op
        }
        // T3 惯性 blur：快速滚动时视频轻微弥散，静止回落 0；
        // T2 章节 hue：IO 目标值缓慢追赶，跨章节色温渐变。
        // 关键：两者都归零时把 filter 整个撤掉——恒定的 filter 会让整段视频
        // 每帧多走一次全屏滤镜通道（重采样 + 掉清晰度），「什么都不做」
        // 才是画面最锐、GPU 最闲的状态。原来常驻的 brightness(1.08) 更糟：
        // 夜空素材本身均值只有 15/255，+8% 增益等于把噪点一起放大。
        hueSm += ((window.__targetHue || 0) - hueSm) * 0.06
        blurSm += (Math.min(1.1, Math.abs(velSm) * 0.035) - blurSm) * 0.18
        const motionBlur = blurSm > 0.04 ? ` blur(${blurSm.toFixed(2)}px)` : ''
        const hue = Math.abs(hueSm) > 0.08 ? ` hue-rotate(${hueSm.toFixed(2)}deg)` : ''
        const filter = `${motionBlur} ${hue}`.trim()
        if (filter !== filterWritten) {
          bgCanvas.style.filter = filter
          filterWritten = filter
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
      setAccent(ACCENT_DEFAULT, 'default')
      bgCanvas.style.filter = ''
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
    <div className={isCopy ? 'site-shell copy-page' : 'site-shell'}>
      {isCopy && <CopyModeExit />}
      <Preloader />
      <VideoBackground />
      <ParticleField />
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
    </div>
  )
}
