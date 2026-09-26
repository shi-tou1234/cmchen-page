import { useState } from 'react'
import Reveal from './Reveal'
import SplitText from './SplitText'
import awards from '../data/content/awards.json'

// 荣誉名录：编辑式索引行陈列（编号/年份/奖名/徽章），悬停联动——
// 活动行提亮左移、其余退后，背景巨型年份水印随悬停切换（key 重挂载触发入场动画）
// 数据全部来自后台「荣誉」可编辑 JSON，无硬编码；样式内嵌于组件，避免改动全局 index.css
const STYLE = `
.award-list{width:100%;margin-top:48px;border-top:1px solid var(--border-strong);
  /* 背景视频会滚到山体这类高亮段落，纯文字直接压在上面就读不清了。
     给名单一块半透明「纸」：底色 + 背景模糊，不改视频素材本身，
     文字的可读性由这一层保证（对比度从随视频起伏变成恒定）。 */
  background:rgba(9,8,7,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-radius:var(--radius-lg);overflow:hidden}
.award-row{position:relative;opacity:0;transform:translateY(18px)}
.reveal.is-visible .award-row{animation:award-row-in .65s var(--ease-out) both;animation-delay:calc(var(--i)*110ms)}
@keyframes award-row-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.award-row-in{display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:24px;
  padding:30px 24px;border-bottom:1px solid var(--border);
  transition:opacity .35s ease,background .3s ease,box-shadow .3s ease,padding-left .35s var(--ease-out)}
.award-list.has-active .award-row:not(.is-active) .award-row-in{opacity:.32}
@media (hover:hover){
  .award-row:hover .award-row-in{background:rgba(255,255,255,.04);
    box-shadow:inset 1px 0 0 rgba(227,217,198,.8);padding-left:36px}
}
.award-row-idx{font-family:var(--font-mono);font-size:11px;font-weight:400;letter-spacing:.14em;
  color:var(--text-faint);font-variant-numeric:tabular-nums;transition:color .3s ease}
.award-row.is-active .award-row-idx{color:var(--accent)}
.award-name-wrap{min-width:0;display:flex;flex-direction:column;gap:7px}
.award-row-year{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.28em;
  color:var(--accent-2);opacity:.85;transition:opacity .3s ease}
/* 奖名走衬线：中文奖名在宋体下的重量感远超黑体加粗 */
.award-row-name{font-family:var(--font-serif-cjk);font-size:clamp(19px,2.2vw,30px);font-weight:600;
  letter-spacing:.01em;line-height:1.36;color:var(--text)}
.award-row-group{font-size:13.5px;line-height:1.7;letter-spacing:.02em;color:var(--text-dim)}
.award-row-badge{justify-self:end}
.award-row-badge .award-badge{margin-top:0}
.award-row-foot{margin-top:32px;font-size:14px;line-height:1.85;color:var(--text-dim);text-align:center}
.award-year-morph{animation:award-year-in .7s var(--ease-out) both}
@keyframes award-year-in{from{opacity:0;transform:translate(-50%,-50%) scale(.965)}
  to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@media (max-width:760px){
  .award-row-in{grid-template-columns:44px 1fr;gap:14px;padding:22px 14px}
  .award-row:hover .award-row-in{padding-left:14px}
  .award-row-name{font-size:17px}
  .award-row-badge{grid-column:2;justify-self:start}
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
