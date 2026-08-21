import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setOpen(false)

  return (
    <header className={`nav${scrolled || open ? ' is-scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#top" className="logo" onClick={close}>
          cmchen<span className="logo-dot">.</span>
        </a>
        <nav className="nav-links" aria-label="主导航">
          <a className="nav-link" href="#projects">
            项目
          </a>
          <a className="nav-link" href="#blog">
            博客
          </a>
          <a className="nav-cta" href="#contact">
            联系我
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
      </div>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        <a href="#projects" onClick={close}>
          项目
        </a>
        <a href="#blog" onClick={close}>
          博客
        </a>
        <a href="#contact" onClick={close}>
          联系我
        </a>
      </div>
    </header>
  )
}
