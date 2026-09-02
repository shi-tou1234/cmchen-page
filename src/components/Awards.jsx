import Reveal from './Reveal'
import awards from '../data/content/awards.json'

export default function Awards() {
  const a = awards.items[0]
  if (!a) return null

  return (
    <section className="section section--award" id="awards">
      <span className="sec-ghost" aria-hidden="true">AWARDS</span>
      {/* 年份巨型水印：居中、超大、低存在感，营造荣誉殿堂氛围 */}
      <span className="award-year-bg" aria-hidden="true">
        {a.year}
      </span>
      <div className="container award-honor">
        <Reveal>
          <div className="section-head award-head">
            <div>
              <div className="sec-no">02</div>
              <p className="eyebrow">Awards</p>
              <h2 className="section-title">竞赛</h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="award-card">
            <p className="award-card-name">{a.name}</p>
            <p className="award-card-group">{a.group}</p>
            <span className="award-badge">
              <i>{a.level}</i>
              {a.result}
            </span>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <p className="award-more">{awards.footNote}</p>
        </Reveal>
      </div>
    </section>
  )
}
