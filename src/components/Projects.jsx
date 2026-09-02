import { useEffect, useRef } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'
import TiltCard from './TiltCard'
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

export default function Projects() {
  const spaceRef = useRef(null)
  const stageRef = useRef(null)
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const idxRef = useRef(null)

  // 横向画廊：sticky 钉住视口，滚动进度映射为轨道位移（原生滚动，不劫持滚轮）
  // 移动端 / 减少动效：CSS 回退为纵向堆叠或原生横向滚动，这里直接不驱动
  useEffect(() => {
    const space = spaceRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!space || !stage || !track) return undefined
    const bar = barRef.current
    const idx = idxRef.current
    const desktop = window.matchMedia('(min-width: 861px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0

    const cards = trackRef.current ? [...track.children] : []

    const apply = () => {
      raf = 0
      if (!desktop.matches || reduced.matches) {
        track.style.transform = ''
        cards.forEach((el) => {
          el.style.setProperty('--focus-scale', 1)
          el.style.setProperty('--focus-dim', 1)
        })
        return
      }
      const rect = space.getBoundingClientRect()
      const total = space.offsetHeight - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
      const max = Math.max(0, track.scrollWidth - stage.clientWidth)
      const x = -p * max
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`
      if (bar) bar.style.transform = `scaleX(${0.08 + p * 0.92})`
      // 焦点卡：越靠近视口中线越完整，远处的卡轻微缩小变暗，制造纵深感
      const mid = stage.clientWidth / 2
      cards.forEach((el) => {
        const c = el.offsetLeft + el.offsetWidth / 2 + x
        const d = Math.min(1, Math.abs(c - mid) / (stage.clientWidth * 0.62))
        el.style.setProperty('--focus-scale', (1 - d * 0.09).toFixed(3))
        el.style.setProperty('--focus-dim', (1 - d * 0.5).toFixed(3))
      })
      if (idx) {
        // 当前卡 = 中心离视口中线最近的那张
        const viewCenter = -x + stage.clientWidth / 2
        let best = 0
        let bestD = Infinity
        cards.forEach((el, i) => {
          const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - viewCenter)
          if (d < bestD) {
            bestD = d
            best = i
          }
        })
        idx.textContent = String(best + 1).padStart(2, '0')
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="section section--gallery" id="projects">
      <span className="sec-ghost" aria-hidden="true">WORKS</span>
      <div className="gallery-space" ref={spaceRef}>
        <div className="gallery-viewport">
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
          </div>
          <div className="gallery-stage" ref={stageRef}>
            <div className="gallery-track" ref={trackRef}>
              {projects.items.map((p, i) => (
                <Reveal key={p.index} delay={i * 80} variant="up">
                  <TiltCard>
                    <a
                      className="project-card"
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      style={p.color ? { '--orb-color': p.color } : undefined}
                    >
                      <div className="project-thumb" data-theme={p.theme}>
                        <span className="thumb-grid" aria-hidden="true" />
                        <span className="thumb-orb" aria-hidden="true" />
                        <Glyph kind={p.kind} />
                        <span className="thumb-tick tl" aria-hidden="true" />
                        <span className="thumb-tick br" aria-hidden="true" />
                        <span className="project-index" aria-hidden="true">
                          {p.index}
                        </span>
                      </div>
                      <div className="project-body">
                        <div className="project-meta">
                          <span>{p.year}</span>
                          <i />
                          <span>{p.kind}</span>
                        </div>
                        <h3 className="project-title">{p.title}</h3>
                        <p className="project-desc">{p.desc}</p>
                        <div className="project-foot">
                          <ul className="tags">
                            {p.tags.map((t) => (
                              <li key={t} className="tag">
                                {t}
                              </li>
                            ))}
                          </ul>
                          <span className="project-go">
                            <Arrow />
                          </span>
                        </div>
                      </div>
                    </a>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="container gallery-hud" aria-hidden="true">
            <span className="gallery-count">
              <b ref={idxRef}>01</b> / {String(projects.items.length).padStart(2, '0')}
            </span>
            <span className="gallery-progress">
              <i ref={barRef} />
            </span>
            <span className="gallery-hint">SCROLL →</span>
          </div>
        </div>
      </div>
    </section>
  )
}
