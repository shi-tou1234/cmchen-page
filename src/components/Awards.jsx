import { useState } from 'react'
import Reveal from './Reveal'
import SplitText from './SplitText'
import awards from '../data/content/awards.json'

// 荣誉名录：编辑式索引行陈列（编号/年份/奖名/徽章），悬停联动——
// 活动行提亮左移、其余退后，背景巨型年份水印随悬停切换（key 重挂载触发入场动画）
// 数据全部来自后台「荣誉」可编辑 JSON，无硬编码；样式内嵌于组件，避免改动全局 index.css
const STYLE = `
.award-list{width:100%;margin-top:44px;border-top:1px solid var(--border-strong)}
.award-row{position:relative;opacity:0;transform:translateY(18px)}
.reveal.is-visible .award-row{animation:award-row-in .65s var(--ease-out) both;animation-delay:calc(var(--i)*110ms)}
@keyframes award-row-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.award-row-in{display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:20px;
  padding:26px 16px;border-bottom:1px solid var(--border);
  transition:opacity .35s ease,background .3s ease,box-shadow .3s ease,padding-left .35s var(--ease-out)}
.award-list.has-active .award-row:not(.is-active) .award-row-in{opacity:.32}
@media (hover:hover){
  .award-row:hover .award-row-in{background:rgba(255,255,255,.03);
    box-shadow:inset 3px 0 0 rgba(157,184,255,.75);padding-left:26px}
}
.award-row-idx{font-family:var(--font-mono);font-size:13px;font-weight:600;letter-spacing:.1em;
  color:var(--text-faint);font-variant-numeric:tabular-nums;transition:color .3s ease}
.award-row.is-active .award-row-idx{color:var(--accent)}
.award-name-wrap{min-width:0}
.award-row-year{font-family:var(--font-mono);font-size:12px;letter-spacing:.24em;
  color:var(--accent-2);opacity:.75;margin-bottom:6px;transition:opacity .3s ease}
.award-row-name{font-size:clamp(19px,2.6vw,34px);font-weight:700;letter-spacing:-.015em;
  line-height:1.3;color:var(--text)}
.award-row-group{margin-top:6px;font-size:13px;color:var(--text-dim)}
.award-row-badge{justify-self:end}
.award-row-badge .award-badge{margin-top:0}
.award-row-foot{margin-top:26px;font-size:14px;color:var(--text-faint);text-align:left}
.award-year-morph{animation:award-year-in .7s var(--ease-out) both}
@keyframes award-year-in{from{opacity:0;transform:translate(-50%,-50%) scale(.965)}
  to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@media (max-width:760px){
  .award-row-in{grid-template-columns:44px 1fr auto;gap:12px;padding:20px 8px}
  .award-row:hover .award-row-in{padding-left:8px}
  .award-row-name{font-size:17px}
  .award-row-badge .award-badge{padding:6px 12px;font-size:12px}
}
@media (prefers-reduced-motion: reduce){
  .award-row{opacity:1;transform:none;animation:none}
  .award-year-morph{animation:none}
}
`

export default function Awards() {
  // -1 = 无活动行（未悬停/触屏）：全部行等亮，水印固定 items[0] 年份
  const [active, setActive] = useState(-1)
  const items = awards.items
  if (!items.length) return null

  const shown = items[active] ?? items[0]

  return (
    <section className="section section--award" id="awards">
      <span className="sec-ghost" aria-hidden="true">AWARDS</span>
      <style>{STYLE}</style>
      {/* 年份巨型水印：跟随悬停切换，营造荣誉殿堂氛围 */}
      <span className="award-year-bg award-year-morph" aria-hidden="true" key={shown.year}>
        {shown.year}
      </span>
      <div className="container award-honor">
        <Reveal>
          <div className="section-head award-head">
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

        <Reveal delay={120}>
          <div
            className={`award-list${active >= 0 ? ' has-active' : ''}`}
            onMouseLeave={() => setActive(-1)}
          >
            {items.map((a, i) => (
              <div
                className={`award-row${i === active ? ' is-active' : ''}`}
                key={`${a.year}-${a.name}`}
                style={{ '--i': i }}
                onMouseEnter={() => setActive(i)}
              >
                <div className="award-row-in">
                  <span className="award-row-idx">{`A—${String(i + 1).padStart(2, '0')}`}</span>
                  <span className="award-name-wrap">
                    <span className="award-row-year">{a.year}</span>
                    <span className="award-row-name">{a.name}</span>
                    <span className="award-row-group">{a.group}</span>
                  </span>
                  <span className="award-row-badge">
                    <span className="award-badge">
                      <i>{a.level}</i>
                      {a.result}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={220}>
          <p className="award-row-foot">{awards.footNote}</p>
        </Reveal>
      </div>
    </section>
  )
}
