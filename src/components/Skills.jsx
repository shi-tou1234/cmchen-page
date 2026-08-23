import Reveal from './Reveal'
import skills from '../data/content/skills.json'

// 技能表（瑞士表格风：编号 / 名称 / 领域 / 熟练度），内容在后台「技能」中可编辑
// 样式内嵌于组件，避免改动全局 index.css
const STYLE = `
.skill-sw{border-top:1px solid rgba(255,255,255,.16)}
.skill-row{display:grid;grid-template-columns:88px 1.2fr 1fr 150px;align-items:center;gap:12px;
  padding:22px 10px;border-bottom:1px solid var(--border);
  box-shadow:inset 2px 0 0 rgba(157,184,255,0);
  transition:background .18s ease,color .18s ease,box-shadow .25s ease,padding-left .25s var(--ease-out)}
.skill-row:hover{background:#f2f2f2;color:#0b0b0e;box-shadow:inset 3px 0 0 rgba(52,80,214,.9);padding-left:16px}
.skill-idx{font-size:13px;font-weight:600;color:#5a78ff;letter-spacing:.08em;font-variant-numeric:tabular-nums}
.skill-row:hover .skill-idx{color:#3450d6}
.skill-name{font-size:clamp(17px,1.8vw,24px);font-weight:700;letter-spacing:-.02em}
.skill-field{font-size:13px;color:var(--text-dim);transition:color .18s ease}
.skill-row:hover .skill-field{color:rgba(11,11,14,.62)}
.skill-score{font-size:15px;font-weight:600;text-align:right;font-variant-numeric:tabular-nums}
@media(max-width:760px){
  .skill-row{grid-template-columns:56px 1fr 92px;grid-template-areas:"idx name score" "idx field field";row-gap:4px;padding:18px 6px}
  .skill-idx{grid-area:idx}.skill-name{grid-area:name}.skill-field{grid-area:field}.skill-score{grid-area:score}
}
`

export default function Skills() {
  return (
    <section className="section" id="skills">
      <span className="sec-ghost" aria-hidden="true">SKILLS</span>
      <style>{STYLE}</style>
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="sec-no">03</div>
              <p className="eyebrow">Skills</p>
              <h2 className="section-title">技能</h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className="skill-sw">
            {skills.items.map((it, i) => (
              <div className="skill-row" key={it.name}>
                <span className="skill-idx">{`S—${String(i + 1).padStart(2, '0')}`}</span>
                <span className="skill-name">{it.name}</span>
                <span className="skill-field">{it.field}</span>
                <span className="skill-score">{`${String(it.score).padStart(2, '0')} / 100`}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
