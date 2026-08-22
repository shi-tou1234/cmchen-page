import Reveal from './Reveal'
import SplitText from './SplitText'
import awards from '../data/content/awards.json'

export default function Awards() {
  return (
    <section className="section" id="awards">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="sec-no">02</div>
              <p className="eyebrow">Awards</p>
              <h2 className="section-title">
                <SplitText text="竞赛" />
              </h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
          </div>
        </Reveal>

        <div className="award-list">
          {awards.items.map((a, i) => (
            <Reveal key={a.name} delay={i * 110} variant="up">
              <div className="award-row">
                <span className="award-year">{a.year}</span>
                <span className="award-main">
                  <span className="award-name">{a.name}</span>
                  <span className="award-group">{a.group}</span>
                </span>
                <span className="award-badge">
                  <i>{a.level}</i>
                  {a.result}
                </span>
              </div>
            </Reveal>
          ))}
          <Reveal delay={140}>
            <div className="award-more">{awards.footNote}</div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
