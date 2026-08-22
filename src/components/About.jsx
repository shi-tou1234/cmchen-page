import Reveal from './Reveal'
import SplitText from './SplitText'

const FACTS = [
  { k: '专业', v: '电子信息工程' },
  { k: '学历', v: '本科在读' },
  { k: '状态', v: '2025 级本科生' },
]

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="sec-no">01</div>
              <p className="eyebrow">About</p>
              <h2 className="section-title">
                <SplitText text="关于" />
              </h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
          </div>
        </Reveal>

        <div className="about-grid">
          <div className="about-big-wrap">
            <Reveal delay={90}>
              <p className="about-big">
                在电路与代码的交界处做事——用<em>扎实的硬件功底</em>与
                <em>清晰的产品思维</em>，把想法做成能跑、能用、能被看见的东西。
              </p>
            </Reveal>
          </div>

          <Reveal delay={180} variant="right">
            <ul className="about-facts">
              {FACTS.map((f) => (
                <li key={f.k} className="fact-row">
                  <b>{f.k}</b>
                  <span>{f.v}</span>
                </li>
              ))}
            </ul>
            <p className="about-note">
              从点亮第一颗 LED 到独立完成完整项目，我相信少即是多——细节值得被认真对待。
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
