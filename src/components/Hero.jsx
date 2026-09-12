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
// T5 字符斥力：外层 .hero-repel 只做位移（无动画冲突），内层 .hero-char
// 保留 char-bounce 入场动画；鼠标靠近时被推开再 lerp 回弹
function Chars() {
  return hero.name.split('').map((ch, i) => (
    <span key={i} className="hero-repel">
      <span
        className={`hero-char${i === 2 || i === 5 ? ' hero-char--outline' : ''}`}
        style={{ '--d': `${180 + i * 80}ms` }}
        aria-hidden="true"
      >
        {ch}
      </span>
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
    const repelList = Array.from(root.querySelectorAll('.hero-title .hero-repel'))

    // 与 About 同款：IO 门控的连续 rAF 循环——lerp 是逐帧收敛的，
    // 单次 scroll 事件只读到一个中间帧会把状态冻在错值上
    let raf = 0
    let active = false
    // T5 斥力：缓存每字符的中心与当前位移；wrapper 无动画，矩形任何时候可读
    const RADIUS = 150
    const FORCE = 26
    let boxes = null
    let offs = repelList.map(() => ({ x: 0, y: 0 }))
    const measure = () => {
      boxes = repelList.map((el) => {
        const r = el.getBoundingClientRect()
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
      })
    }
    const onResize = () => {
      boxes = null
    }

    const update = () => {
      raf = 0
      if (!boxes) measure()
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
      // T5 鼠标斥力：读取 CursorGlow 共享的全局坐标，靠近的字符被推开
      const mx = window.__cursorX
      const my = window.__cursorY
      const hasMouse = Number.isFinite(mx) && Number.isFinite(my)
      repelList.forEach((el, i) => {
        const b = boxes[i]
        let tx = 0
        let ty = 0
        if (hasMouse && b) {
          // 当前位移量要加回到比较中心，否则推动目标会自我衰减
          const cx = b.cx + offs[i].x
          const cy = b.cy + offs[i].y
          const ddx = cx - mx
          const ddy = cy - my
          const dist = Math.hypot(ddx, ddy)
          if (dist < RADIUS && dist > 0) {
            const k = (1 - dist / RADIUS) * FORCE
            tx = (ddx / dist) * k
            ty = (ddy / dist) * k
          }
        }
        const o = offs[i]
        o.x += (tx - o.x) * 0.22
        o.y += (ty - o.y) * 0.22
        el.style.transform = `translate(${o.x.toFixed(2)}px, ${o.y.toFixed(2)}px)`
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
    window.addEventListener('resize', onResize)

    return () => {
      io.disconnect()
      window.removeEventListener('resize', onResize)
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
            {/* slogan 随角色词一组，挂在发丝线下方；底部只留按钮与落款 */}
            <p className="hero-sub">{hero.subtitle}</p>
          </div>

          <div className="hero-foot">
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
