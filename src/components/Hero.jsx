import { useEffect, useRef } from 'react'
import Arrow from './Arrow'
import Magnetic from './Magnetic'
import WordRotator from './WordRotator'

const NAME = 'cmchen'

function Chars() {
  return NAME.split('').map((ch, i) => (
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
        <p className="hero-eyebrow">Portfolio · 2026</p>
        <div className="hero-title-mask">
          <h1 className="hero-title" aria-label={NAME}>
            <Chars />
          </h1>
          <div className="hero-title-shine" aria-hidden="true">
            <Chars />
          </div>
        </div>
        <div className="hero-roles">
          <WordRotator words={['电子信息学生', '硬件玩家', 'AI 协作开发者', '博客作者']} />
        </div>
        <p className="hero-sub">
          用代码与电路把想法变成现实 —— 这里收录我的项目、博客与思考。
        </p>
        <div className="hero-actions">
          <Magnetic>
            <a href="#projects" className="btn btn-primary">
              查看项目
              <span className="arrow">
                <Arrow />
              </span>
            </a>
          </Magnetic>
          <Magnetic>
            <a href="#contact" className="btn btn-outline">
              联系我
            </a>
          </Magnetic>
        </div>
      </div>
      <div className="hero-scroll">
        <span>SCROLL</span>
        <span className="hero-scroll-line" />
      </div>
    </section>
  )
}
