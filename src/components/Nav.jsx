import { useEffect, useState } from 'react'
import site from '../data/content/site.json'

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
          {site.logo}
          <span className="logo-dot">.</span>
        </a>
        <nav className="nav-links" aria-label="主导航">
          {site.navLinks.map((l) => (
            <a key={l.href} className="nav-link" href={l.href}>
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
      </div>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {site.navLinks.map((l) => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a href={site.navCta.href} onClick={close}>
          {site.navCta.label}
        </a>
      </div>
    </header>
  )
}
