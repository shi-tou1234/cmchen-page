import { useEffect, useRef } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'
import SplitText from './SplitText'
import projects from '../data/content/projects.json'

// 封面图标层：给抽象封面一个可辨识的「这是什么」锚点（线性图标，随主题色）
const glyphProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const GLYPHS = {
  博客脚手架: (
    <svg {...glyphProps}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M9.5 9.5V19.5" />
    </svg>
  ),
  'AI Agent': (
    <svg {...glyphProps}>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z" />
      <path d="M18.5 16.5v4M16.5 18.5h4" />
    </svg>
  ),
  'Web App': (
    <svg {...glyphProps}>
      <path d="M8.5 8.5L5 12l3.5 3.5" />
      <path d="M15.5 8.5L19 12l-3.5 3.5" />
      <path d="M13.2 5.5l-2.4 13" />
    </svg>
  ),
  微信小程序: (
    <svg {...glyphProps}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14.8" y="14.8" width="2.4" height="2.4" fill="currentColor" stroke="none" />
      <path d="M20 14.5v2.3M14.5 20h2.3M20 19.6v.4" />
    </svg>
  ),
}

function Glyph({ kind }) {
  return (
    <span className="thumb-glyph" aria-hidden="true">
      {GLYPHS[kind] ?? GLYPHS['Web App']}
    </span>
  )
}

// 中央垂直时间轴（编排参考 eladiodieste.com 的 Obra 年表）：
// 中轴发丝线贯穿区块，菱形节点 sticky 驻留视口中心、被条目依次「穿过」；
// 条目左右交错，滚动时越靠近视口中线越亮（读 App lerp 平滑值，与全站同源），
// 悬停时其余条目退暗；封面进视口以 clip-path 自下而上揭开，大年份压在中轴上。
export default function Projects() {
  const listRef = useRef(null)

  useEffect(() => {
    const root = listRef.current
    if (!root) return undefined
    const items = Array.from(root.querySelectorAll('.tl-item'))
    if (!items.length) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => {
        el.style.opacity = '1'
        el.classList.add('is-inview')
      })
      return undefined
    }

    // 条目在文档中的绝对位置：字体加载/窗口尺寸变化后重测（Nav/About 同款先例）
    let docTops = []
    let heights = []
    const measure = () => {
      docTops = items.map((el) => el.getBoundingClientRect().top + window.scrollY)
      heights = items.map((el) => el.offsetHeight || 1)
    }

    // ① 滚动联动亮度：条目中心越近视口中线越亮
    const last = new Array(items.length).fill(-1)
    let raf = 0
    let active = false

    const update = () => {
      raf = 0
      const y = window.__smoothY ?? window.scrollY
      const vh = window.innerHeight
      const mid = y + vh / 2
      items.forEach((el, i) => {
        const d = Math.min(1, Math.abs(docTops[i] + heights[i] / 2 - mid) / (vh * 0.6))
        const v = 1 - d * 0.75
        if (Math.abs(v - last[i]) > 0.008) {
          el.style.opacity = v.toFixed(3)
          last[i] = v
        }
      })
      if (active) raf = requestAnimationFrame(update)
    }

    // 仅当时间轴进入视口邻域时才驱动 rAF：接得住 lerp 尾巴，也省全局帧
    const lightIO = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting
        if (active && !raf) raf = requestAnimationFrame(update)
      },
      { rootMargin: '20% 0px 20% 0px' },
    )
    lightIO.observe(root)

    // ② 入场揭开：封面 clip 自下而上 + 年份升起（一次性）
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-inview')
            revealIO.unobserve(e.target)
          }
        })
      },
      { threshold: 0.22 },
    )
    items.forEach((el) => revealIO.observe(el))

    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener('resize', measure)

    return () => {
      lightIO.disconnect()
      revealIO.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section className="section section--gallery" id="projects">
      <span className="sec-ghost" aria-hidden="true">WORKS</span>
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="sec-no">04</div>
              <p className="eyebrow">Projects</p>
              <h2 className="section-title">
                <SplitText text={projects.title} />
              </h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
            <a
              className="view-all"
              href={projects.viewAll.href}
              target="_blank"
              rel="noreferrer"
            >
              {projects.viewAll.label}
              <span className="arrow">
                <Arrow />
              </span>
            </a>
          </div>
        </Reveal>

        <div className="timeline" ref={listRef}>
          <div className="tl-axis" aria-hidden="true">
            <div className="tl-diamond-wrap">
              <span className="tl-diamond" />
            </div>
          </div>
          <ol className="tl-list">
            {projects.items.map((p, i) => (
              <li
                className={`tl-item tl-item--${i % 2 === 0 ? 'l' : 'r'}`}
                key={p.index}
              >
                <div className="tl-inner">
                  <a
                    className="tl-card"
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="tl-thumb-wrap">
                      <div
                        className="project-thumb"
                        data-theme={p.theme}
                        style={p.color ? { '--orb-color': p.color } : undefined}
                      >
                        <span className="thumb-grid" aria-hidden="true" />
                        <span className="thumb-orb" aria-hidden="true" />
                        <Glyph kind={p.kind} />
                        <span className="thumb-tick tl" aria-hidden="true" />
                        <span className="thumb-tick br" aria-hidden="true" />
                        <span className="project-index" aria-hidden="true">
                          {p.index}
                        </span>
                      </div>
                    </div>
                    <div className="tl-text">
                      <div className="project-meta">
                        <span>{p.year}</span>
                        <i />
                        <span>{p.kind}</span>
                      </div>
                      <h3 className="tl-title">{p.title}</h3>
                      <p className="tl-desc">{p.desc}</p>
                      <ul className="tags">
                        {p.tags.map((t) => (
                          <li key={t} className="tag">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </a>
                </div>
                <span className="tl-year" aria-hidden="true">
                  {p.year}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
