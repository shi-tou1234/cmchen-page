import { useEffect, useRef, useState } from 'react'
import site from '../data/content/site.json'

// 顶部导航：滚动进度发丝线 + 当前区块高亮（IntersectionObserver）+ mono 序号
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const progressRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24) // 布尔同值时 React 自动跳过重渲染
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      // 高频进度直写 style，避免每滚动帧走一遍 React 渲染
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 滚动监听：视口中线扫过哪个区块，就点亮对应导航项
  useEffect(() => {
    const ids = site.navLinks
      .map((l) => l.href.replace(/^#/, ''))
      .filter(Boolean)
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!sections.length) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(`#${e.target.id}`)
        }
      },
      { rootMargin: '-38% 0px -52% 0px' }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  const close = () => setOpen(false)

  return (
    <header className={`nav${scrolled || open ? ' is-scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#top" className="logo" onClick={close}>
          {site.logo}
          <span className="logo-dot">.</span>
          <span className="logo-mono">FOLIO / 26</span>
        </a>
        <nav className="nav-links" aria-label="主导航">
          {site.navLinks.map((l, i) => (
            <a
              key={l.href}
              className={`nav-link${active === l.href ? ' is-active' : ''}`}
              href={l.href}
            >
              <span className="nav-idx">{String(i + 1).padStart(2, '0')}</span>
              {l.label}
            </a>
          ))}
          <a className="nav-cta" href={site.navCta.href}>
            {site.navCta.label}
          </a>
        </nav>
        <button
          type="button"
          className={`nav-toggle${open ? ' open' : ''}`}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <span
          className="nav-progress"
          ref={progressRef}
          aria-hidden="true"
        />
      </div>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {site.navLinks.map((l, i) => (
          <a key={l.href} href={l.href} onClick={close}>
            {String(i + 1).padStart(2, '0')} — {l.label}
          </a>
        ))}
        <a href={site.navCta.href} onClick={close}>
          {site.navCta.label}
        </a>
      </div>
    </header>
  )
}
