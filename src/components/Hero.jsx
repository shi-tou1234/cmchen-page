import { useEffect, useRef } from 'react'
import Arrow from './Arrow'
import Magnetic from './Magnetic'
import WordRotator from './WordRotator'
import hero from '../data/content/hero.json'

function Chars() {
  return hero.name.split('').map((ch, i) => (
    <span
      key={i}
      className="hero-char"
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
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = contentRef.current
        if (!el) return
        const y = window.scrollY
        const vh = window.innerHeight
        if (y > vh) return
        el.style.transform = `translateY(${y * 0.28}px)`
        el.style.opacity = String(Math.max(0, 1 - y / (vh * 0.75)))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="hero" id="top">
      <div className="hero-glow g1" />
      <div className="container hero-content" ref={contentRef}>
        <p className="hero-eyebrow">{hero.eyebrow}</p>
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
