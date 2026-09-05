import { useEffect, useRef } from 'react'
import Arrow from './Arrow'
import Magnetic from './Magnetic'
import WordRotator from './WordRotator'
import hero from '../data/content/hero.json'
import about from '../data/content/about.json'
import contact from '../data/content/contact.json'

// 分体巨字 hero（编排参考 eladiodieste.com）：名字巨字居左上，eyebrow 首词大写后
// 作为第二巨字沉到右下，两者之间一条贯穿发丝线承载 meta。滚动时三层以不同速率
// 下移消隐——第二巨字最快、名字最慢，退场时上下「拉开」，与参考站同名分体字的
// 离场层次一致。文案全部来自后台可编辑 JSON，无硬编码。
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

function BrWord({ word }) {
  return word.split('').map((ch, i) => (
    <span className="br-char" key={i} style={{ '--d': `${880 + i * 55}ms` }} aria-hidden="true">
      {ch}
    </span>
  ))
}

export default function Hero() {
  const contentRef = useRef(null)
  const tlRef = useRef(null)
  const midRef = useRef(null)
  const brRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const root = contentRef.current
    const charList = root ? Array.from(root.querySelectorAll('.hero-title .hero-char')) : []
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (!root) return
        // 读平滑插值（App.jsx lerp 层驱动），而非原生 scrollY——所有动画共享"重量感"
        const y = window.__smoothY ?? window.scrollY
        const vh = window.innerHeight
        if (y > vh) return
        // 半屏内干净淡出，避免内容半透明悬停在星云上的中间态
        const t = Math.min(1, y / (vh * 0.55))
        root.style.opacity = String(Math.max(0, 1 - t))
        // 三层差异化视差：拉开节奏与参考站分体字的离场一致
        if (tlRef.current) tlRef.current.style.transform = `translateY(${(y * 0.14).toFixed(1)}px)`
        if (midRef.current) midRef.current.style.transform = `translateY(${(y * 0.26).toFixed(1)}px)`
        if (brRef.current) brRef.current.style.transform = `translateY(${(y * 0.4).toFixed(1)}px)`
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
  // 第二巨字与年份落款：从 eyebrow「Portfolio · 2026」派生，保持单一数据源
  const [brWord, brYear] = hero.eyebrow.split('·').map((s) => s.trim())

  return (
    <section className="hero" id="top">
      <div className="hero-glow g1" />
      <div className="container hero-content" ref={contentRef}>
        <div className="hero-word-tl" ref={tlRef}>
          <div className="hero-title-mask">
            <h1 className="hero-title" aria-label={hero.name}>
              <Chars />
            </h1>
          </div>
        </div>

        <div className="hero-mid" ref={midRef}>
          <div className="hero-midline">
            <span>{hero.eyebrow}</span>
            {facts && <span className="hero-mid-facts">{facts}</span>}
            <a
              className="hero-mid-link"
              href={contact.githubButton.href}
              target="_blank"
              rel="noreferrer"
            >
              {contact.githubButton.label} ↗
            </a>
          </div>
          <div className="hero-roles">
            <WordRotator words={hero.roles} />
          </div>
        </div>

        <div className="hero-word-br-wrap" aria-hidden="true">
          <span className="hero-word-br" ref={brRef}>
            <BrWord word={(brWord || 'PORTFOLIO').toUpperCase()} />
          </span>
        </div>

        <div className="hero-foot">
          <div className="hero-foot-main">
            <p className="hero-sub">{hero.subtitle}</p>
            <div className="hero-cta">
              <Magnetic>
                <a href={hero.ctaPrimary.href} className="hero-cta-link">
                  {hero.ctaPrimary.label}
                  <span className="arrow">
                    <Arrow />
                  </span>
                </a>
              </Magnetic>
              <Magnetic>
                <a href={hero.ctaSecondary.href} className="hero-cta-link">
                  {hero.ctaSecondary.label}
                  <span className="arrow">
                    <Arrow />
                  </span>
                </a>
              </Magnetic>
            </div>
          </div>
          <span className="hero-copy">{brYear ? `© ${brYear}` : ''}</span>
        </div>
      </div>
      <div className="hero-scroll">
        <span>{hero.scrollHint}</span>
        <span className="hero-scroll-line" />
      </div>
    </section>
  )
}
