import Reveal from './Reveal'
import Arrow from './Arrow'
import TiltCard from './TiltCard'
import SplitText from './SplitText'
import projects from '../data/content/projects.json'

export default function Projects() {
  return (
    <section className="section" id="projects">
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
        <div className="projects-grid">
          {projects.items.map((p, i) => (
            <Reveal key={p.index} delay={i * 110} variant={i % 2 ? 'right' : 'left'}>
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
