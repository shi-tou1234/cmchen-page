import { useEffect, useRef } from 'react'
import Arrow from './Arrow'
import Magnetic from './Magnetic'
import WordRotator from './WordRotator'
import hero from '../data/content/hero.json'
import about from '../data/content/about.json'
import contact from '../data/content/contact.json'

function Chars() {
  return hero.name.split('').map((ch, i) => (
    <span
      key={i}
      className={`hero-char${i === 2 || i === 5 ? ' hero-char--outline' : ''}`}
      style={{ '--d': `${180 + i * 80}ms` }}
      aria-hidden="true"
    >
      {ch}
    </span>
  ))
}

export default function Hero() {
  const contentRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const charList = contentRef.current
      ? Array.from(contentRef.current.querySelectorAll('.hero-title .hero-char'))
      : []
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = contentRef.current
        if (!el) return
        // 读平滑插值（App.jsx lerp 层驱动），而非原生 scrollY——所有动画共享"重量感"
        const y = window.__smoothY ?? window.scrollY
        const vh = window.innerHeight
        if (y > vh) return
        // 半屏内干净淡出，避免内容半透明悬停在星云上的中间态
        const t = Math.min(1, y / (vh * 0.55))
        el.style.transform = `translateY(${y * 0.22}px)`
        el.style.opacity = String(Math.max(0, 1 - t))
        // 逐字微差消隐：各字符按不同速率变淡，退场像「散开」而非整体变淡
        charList.forEach((c, i) => {
          c.style.opacity = String(Math.max(0, 1 - t * (0.8 + ((i * 7) % 5) * 0.18)))
        })
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // meta 行中段：取关于区的专业/学历事实，保持单一数据源
  const facts = about.facts.map((f) => f.v).filter(Boolean).slice(0, 2).join(' · ')

  return (
    <section className="hero" id="top">
      <div className="hero-glow g1" />
      <span className="hero-vertical" aria-hidden="true">
        DEEP SPACE · {hero.eyebrow}
      </span>
      <div className="container hero-content" ref={contentRef}>
        <div className="hero-meta">
          <span>{hero.eyebrow}</span>
          {facts && <span className="hero-meta-mid">{facts}</span>}
          <a
            className="hero-meta-link"
            href={contact.githubButton.href}
            target="_blank"
            rel="noreferrer"
          >
            GITHUB ↗
          </a>
        </div>
        <div className="hero-title-mask">
          <h1 className="hero-title" aria-label={hero.name}>
            <Chars />
          </h1>
          <div className="hero-title-shine" aria-hidden="true">
            <Chars />
          </div>
        </div>
        <div className="hero-roles">
          <WordRotator words={hero.roles} />
        </div>
        <p className="hero-sub">{hero.subtitle}</p>
        <div className="hero-actions">
          <Magnetic>
            <a href={hero.ctaPrimary.href} className="btn btn-primary">
              {hero.ctaPrimary.label}
              <span className="arrow">
                <Arrow />
              </span>
            </a>
          </Magnetic>
          <Magnetic>
            <a href={hero.ctaSecondary.href} className="btn btn-outline">
              {hero.ctaSecondary.label}
            </a>
          </Magnetic>
        </div>
      </div>
      <div className="hero-scroll">
        <span>{hero.scrollHint}</span>
        <span className="hero-scroll-line" />
      </div>
    </section>
  )
}
