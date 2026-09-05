import { useEffect, useRef } from 'react'
import Arrow from './Arrow'
import Magnetic from './Magnetic'
import WordRotator from './WordRotator'
import hero from '../data/content/hero.json'
import about from '../data/content/about.json'
import contact from '../data/content/contact.json'

// hero（编排参考 eladiodieste.com）：名字巨字居左上，中部一条贯穿发丝线承载
// meta，底部落款行。滚动时两层以不同速率下移消隐，退场有「拉开」的层次。
// 文案全部来自后台可编辑 JSON，无硬编码。
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
    const root = contentRef.current
    const sectionEl = root ? root.closest('.hero') : null
    if (!root || !sectionEl) return
    const charList = Array.from(root.querySelectorAll('.hero-title .hero-char'))

    // 与 About 同款：IO 门控的连续 rAF 循环——lerp 是逐帧收敛的，
    // 单次 scroll 事件只读到一个中间帧会把状态冻在错值上
    let raf = 0
    let active = false

    const update = () => {
      raf = 0
      // 读平滑插值（App.jsx lerp 层驱动），而非原生 scrollY——所有动画共享"重量感"
      const y = window.__smoothY ?? window.scrollY
      const vh = window.innerHeight
      // 跑道进度 p：滚轮在前两幕的「剧情进度条」（参考站 250lvh 跑道的移植）
      const runway = Math.max(1, sectionEl.offsetHeight - vh)
      const p = Math.min(1, Math.max(0, y / runway))
      // 内容淡出窗口拉长（0.18 → 0.85）：减少跑道中段的空白感
      const fade = Math.min(1, Math.max(0, (p - 0.18) / 0.67))
      root.style.opacity = String(Math.max(0, 1 - fade))
      root.style.transform = `translateY(${(-p * 5).toFixed(2)}vh) scale(${(1 - p * 0.05).toFixed(4)})`
      // 逐字微差消隐：各字符按不同速率变淡，退场像「散开」而非整体变淡
      charList.forEach((c, i) => {
        c.style.opacity = String(Math.max(0, 1 - fade * (0.8 + ((i * 7) % 5) * 0.18)))
      })
      if (active) raf = requestAnimationFrame(update)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting
        if (active && !raf) raf = requestAnimationFrame(update)
      },
      { rootMargin: '10% 0px 10% 0px' },
    )
    io.observe(sectionEl)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // meta 行中段：取关于区的专业/学历事实，保持单一数据源
  const facts = about.facts.map((f) => f.v).filter(Boolean).slice(0, 2).join(' · ')
  // 年份落款：从 eyebrow「Portfolio · 2026」派生，保持单一数据源
  const brYear = hero.eyebrow.split('·').map((s) => s.trim())[1]

  return (
    <section className="hero" id="top">
      {/* 参考站式滚动跑道：section 230svh，舞台 sticky 钉住 100svh——
          滚轮在前两幕驱动星空/内容变化，而不是把页面推走 */}
      <div className="hero-stage">
        <div className="hero-glow g1" />
        <div className="container hero-content" ref={contentRef}>
          <div className="hero-word-tl">
            <div className="hero-title-mask">
              <h1 className="hero-title" aria-label={hero.name}>
                <Chars />
              </h1>
            </div>
          </div>

          <div className="hero-mid">
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

          <div className="hero-foot">
            <div className="hero-foot-main">
              <p className="hero-sub">{hero.subtitle}</p>
            <div className="hero-cta">
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
            <span className="hero-copy">{brYear ? `© ${brYear}` : ''}</span>
          </div>

          <div className="hero-scroll">
            <span>{hero.scrollHint}</span>
            <span className="hero-scroll-line" />
          </div>
        </div>
      </div>
    </section>
  )
}
