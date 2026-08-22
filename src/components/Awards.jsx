import Reveal from './Reveal'
import SplitText from './SplitText'

const AWARDS = [
  {
    year: '2026',
    name: '第二十一届全国大学生智能汽车竞赛',
    group: '浙江省赛区',
    result: '三等奖',
    level: '省级',
  },
]

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
          {AWARDS.map((a, i) => (
            <Reveal key={a.name} delay={i * 110} variant="up">
              <div className="award-row" tabIndex={0}>
                <span className="award-year">{a.year}</span>
                <span className="award-main">
                  <span className="award-name">{a.name}</span>
                  <span className="award-group">{a.group}</span>
                </span>
                <span className="award-badge">
                  <i>{a.level}</i>
                  {a.result}
                </span>
                <span className="award-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Reveal>
          ))}
          <Reveal delay={140}>
            <div className="award-more">更多竞赛与项目，正在路上。</div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
