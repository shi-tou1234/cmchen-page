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

// 色温映射：滚动经过不同区块时 accent 微妙偏移。全程收在香槟金一族内
// （亮度/冷暖 ±3%，呼应各段视频的夜色温度），不再出现奶油/琥珀跳色
const ACCENTS = {
  about: { a: '#e9dfc9', a2: '#cdbb92' },
  awards: { a: '#e4d5b4', a2: '#c5a878' },
  skills: { a: '#e7dcc4', a2: '#c9b285' },
  projects: { a: '#e6d9bd', a2: '#c9ab74' },
  blog: { a: '#e9e0cf', a2: '#d0c09d' },
  contact: { a: '#eedcb4', a2: '#d8b87e' },
}
const ACCENT_DEFAULT = { a: '#e6d9bd', a2: '#c9ab74' }

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

    const clamp01 = (v) => Math.min(1, Math.max(0, v))
    const sstep = (t) => t * t * (3 - 2 * t)

    // ghost 边界交接：幽灵水印字是贯穿 7 个边界的那件「活过去的元素」——
    // 下一节的 ghost 以放大+低透明从上一节的散场里浮出，落位中线时归位（scale 1 / opacity 1），
    // 离场再放大淡出。承载判据同 onetake：活过边界、位移或缩放可见。
    let ghostData = []
    // 内容层滚动运镜（领导拍板「明显」）：进场 0.96→1 推近 + 26px 升沉，
    // 出场 1→1.03 继续推离；区块停进阅读区后必须 dead still（scale/ty 全等于恒等）。
    // 只写 transform；hero 不参与（有自己的跑道运镜）；copy 阅读模式不参与。
    const camEls = isCopy
      ? []
      : [
          ...document.querySelectorAll('.section > .container'),
          document.querySelector('.stats-strip > .container'),
          document.querySelector('.marquee'),
          document.querySelector('.contact > .container'),
          document.querySelector('.footer > .container'),
        ].filter(Boolean)
    let camData = []

    // 度量缓存：只在开工/尺寸变化/异步内容把页面撑高时重算（每帧读 rect 会抖动布局）
    const measureAll = () => {
      const y = window.scrollY
      ghostData = ghosts.map((g) => {
        const host = g.parentElement
        const r = host ? host.getBoundingClientRect() : { top: 0 }
        return { el: g, top: r.top + y, lastT: '', lastO: -1 }
      })
      camData = camEls.map((el) => {
        const host = el.closest('.section, .contact, .footer, .stats-strip') || el
        const r = host.getBoundingClientRect()
        return {
          el,
          top: r.top + y,
          lastT: '',
          promoted: false,
        }
      })
    }
    measureAll()
    const ro = new ResizeObserver(() => measureAll())
    if (camEls.length) ro.observe(document.body)

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
      const vh = window.innerHeight
      if (bgCanvas) {
        // 滚轮响应：smoothstep 缓动 + 下沉 + 轻微放大 + 压暗。
        // 只写 opacity/transform（合成器属性）——旧版的 hue-rotate / 惯性 blur
        // 是整屏每帧重跑一次滤镜通道的性能黑洞，运镜交给 CSS Ken Burns 后这里全部撤掉。
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
      }
      for (const g of ghostData) {
        const topVis = g.top - currentY
        const pIn = sstep(clamp01((vh - topVis) / (vh * 0.9)))
        const pOut = sstep(clamp01(-topVis / (vh * 0.9)))
        const scale = 1 + 0.14 * (1 - pIn) + 0.1 * pOut
        const op = (0.35 + 0.65 * pIn) * (1 - 0.35 * pOut)
        const offset = Math.max(-150, Math.min(150, (currentY - g.top) * -0.06))
        const t = `translateY(${offset.toFixed(1)}px) scale(${scale.toFixed(4)})`
        if (t !== g.lastT) {
          g.el.style.transform = t
          g.lastT = t
        }
        if (Math.abs(op - g.lastO) > 0.01) {
          g.el.style.opacity = op.toFixed(3)
          g.lastO = op
        }
      }
      for (const c of camData) {
        const topVis = c.top - currentY
        const pIn = sstep(clamp01((vh * 0.96 - topVis) / (vh * 0.85)))
        const pOut = sstep(clamp01(-topVis / (vh * 0.7)))
        const scale = (0.96 + 0.04 * pIn) * (1 + 0.03 * pOut)
        const ty = 26 * (1 - pIn) - 16 * pOut
        const t = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
        if (t !== c.lastT) {
          c.el.style.transform = t
          c.lastT = t
          // 合成层动态升降级：只在真的动起来且临近视口时占一层 GPU 内存，
          // 回到恒等（阅读区/远屏外）就还回去——常驻 8 层大平面会跟视频解码抢预算
          const near = Math.abs(topVis) < vh * 2
          const identity = pIn >= 1 && pOut <= 0
          if (identity || !near) {
            if (c.promoted) {
              c.el.style.willChange = ''
              c.promoted = false
            }
          } else if (!c.promoted) {
            c.el.style.willChange = 'transform'
            c.promoted = true
          }
        }
      }
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
    const onResize = () => measureAll()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(loop)

    return () => {
      observer.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', onScrollRaw)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
      cancelAnimationFrame(raf)
      setAccent(ACCENT_DEFAULT, 'default')
      window.__smoothY = 0
    }
  }, [isAdmin, isCopy])

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
