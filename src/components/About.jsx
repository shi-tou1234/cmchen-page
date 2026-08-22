import Reveal from './Reveal'
import SplitText from './SplitText'
import about from '../data/content/about.json'

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
              <p
                className="about-big"
                dangerouslySetInnerHTML={{ __html: about.intro }}
              />
            </Reveal>
          </div>

          <Reveal delay={180} variant="right">
            <ul className="about-facts">
              {about.facts.map((f) => (
                <li key={f.k} className="fact-row">
                  <b>{f.k}</b>
                  <span>{f.v}</span>
                </li>
              ))}
            </ul>
            <p className="about-note">{about.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
