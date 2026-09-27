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
  桌面工具: (
    <svg {...glyphProps}>
      <rect x="3.5" y="4.5" width="17" height="13" rx="2" />
      <path d="M3.5 8.5h17M6.8 6.6h.01M9.4 6.6h.01" />
      <path d="M12 17.5v3M8.5 20.5h7" />
    </svg>
  ),
  桌面应用: (
    <svg {...glyphProps}>
      <rect x="4" y="4" width="16" height="12" rx="1.5" />
      <path d="M9.5 7.5l-2 2.5 2 2.5M14.5 7.5l2 2.5-2 2.5" />
      <path d="M12 16v4M8 20h8" />
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

// 项目陈列：纵向交错网格（Z 字节奏）。旧版「sticky 推轨」把滚轮映射成横移，
// 手感发卡且窗口稍窄就退化成手机横滑——弃用；动效交给 Reveal 入场 + TiltCard
// 悬停倾斜 + 封面色球呼吸，滚动方向与全页一致。
export default function Projects() {
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
        <div className="work-grid">
          {projects.items.map((p, i) => (
            <Reveal
              key={p.index}
              delay={(i % 2) * 90}
              variant="up"
              ease={i % 2 ? 'spring' : 'snap'}
            >
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
    </section>
  )
}
