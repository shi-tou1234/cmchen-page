import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'
import SplitText from './SplitText'
import skills from '../data/content/skills.json'

// 技能动能榜（瑞士表格风升级版）：编号 / 名称 / 领域 / 熟练轨 / 档位
// 编排感三件套：① 进场时熟练轨画入、评分数字 odometer 滚动（仅当数据含 score）
// ② 光标接近时行群体剪切反应（上下行反向轻移，像铁屑趋磁）③ 悬停整行反白（沿用旧版）
// score 兼容策略：v2 内容无 score 字段（设计上有意以档位替代自评分），
// 轨长按档位映射作视觉默认（主力 90/熟练 70/在学 35）；后台回填真实 score 后自动改用真值并显示数字
// 数据全部来自后台「技能」可编辑 JSON；样式内嵌于组件，避免改动全局 index.css
const LEVEL_CLASS = { 主力: 'is-core', 熟练: '', 在学: 'is-learning' }
const LEVEL_POS = { 主力: 90, 熟练: 70, 在学: 35 }
const STYLE = `
.skill-sw{border-top:1px solid var(--border-strong)}
.skill-row{display:grid;grid-template-columns:92px 1.15fr 1fr 180px 116px;align-items:center;gap:14px;
  padding:24px 12px;border-bottom:1px solid var(--border);
  translate:var(--pull,0) 0;
  box-shadow:inset 2px 0 0 rgba(201,171,116,0);
  transition:background .25s ease,color .25s ease,box-shadow .3s ease,padding-left .3s var(--ease-out)}
/* 悬停反白成奶油实底：整行变成一张「卡片」，与导航/按钮同一套实体语言 */
.skill-row:hover{background:var(--text);color:#0b0c10;box-shadow:inset 3px 0 0 rgba(201,171,116,.9);padding-left:22px}
.skill-idx{font-family:var(--font-mono);font-size:11px;font-weight:400;color:var(--accent-2);
  letter-spacing:.1em;font-variant-numeric:tabular-nums;transition:color .25s ease}
.skill-row:hover .skill-idx{color:rgba(11,12,16,.55)}
/* 技能名多为中文/英文混排，衬线体让它像「能力清单」而不是表格数据 */
.skill-name{font-family:var(--font-display);font-size:clamp(19px,2.15vw,28px);font-weight:500;
  letter-spacing:.005em;line-height:1.3;transition:color .25s ease}
.skill-field{font-size:14px;letter-spacing:.02em;color:var(--text-dim);transition:color .25s ease}
.skill-row:hover .skill-field{color:rgba(11,12,16,.66)}
.skill-gauge{display:flex;align-items:center;gap:10px;min-width:0}
.skill-rail{position:relative;flex:1;height:1px;background:var(--border-strong);transition:background .25s ease}
.skill-rail-fill{position:absolute;top:0;bottom:0;left:0;width:100%;transform-origin:left;
  transform:scaleX(0);background:linear-gradient(90deg,var(--accent),var(--accent-2));
  transition:transform 1s var(--ease-out);transition-delay:calc(var(--i)*70ms + 150ms)}
.reveal.is-visible .skill-rail-fill{transform:scaleX(calc(var(--score)/100))}
.skill-row:hover .skill-rail{background:rgba(11,12,16,.16)}
.skill-row:hover .skill-rail-fill{background:linear-gradient(90deg,#0b0c10,#5a4c36)}
.skill-score{font-family:var(--font-mono);font-size:12px;font-variant-numeric:tabular-nums;
  color:var(--text-faint);min-width:26px;text-align:right;transition:color .25s ease}
.skill-row:hover .skill-score{color:rgba(11,12,16,.6)}
.skill-level{justify-self:end;font-family:var(--font-mono);font-size:10.5px;font-weight:400;letter-spacing:.2em;
  color:var(--accent);border:1px solid rgba(230,217,189,.4);border-radius:2px;padding:6px 12px;
  transition:color .25s ease,border-color .25s ease}
.skill-level.is-core{color:var(--accent-2);border-color:rgba(201,171,116,.5)}
.skill-level.is-learning{color:var(--text-faint);border-color:var(--border-strong)}
.skill-row:hover .skill-level{color:#0b0c10;border-color:rgba(11,12,16,.42)}
.reveal .skill-row{opacity:0;transform:translateY(18px)}
.reveal.is-visible .skill-row{opacity:1;transform:none;animation:skill-in .6s var(--ease-out) both;animation-delay:calc(var(--i)*70ms)}
@keyframes skill-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .reveal .skill-row{opacity:1;transform:none;animation:none}
  .skill-rail-fill{transition:none}
}
@media(max-width:760px){
  .skill-row{grid-template-columns:58px 1fr 92px;
    grid-template-areas:"idx name level" "idx field field" "idx gauge gauge";row-gap:9px;padding:20px 6px}
  .skill-idx{grid-area:idx}.skill-name{grid-area:name}.skill-field{grid-area:field}
  .skill-level{grid-area:level}.skill-gauge{grid-area:gauge}
}
`

// 评分 odometer：入视口后 rAF 从 0 滚到 score；reduced-motion 直出终值
function ScoreNum({ to, index }) {
  const ref = useRef(null)
  const [val, setVal] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? to : 0
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const dur = 1000 + index * 70
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(to * eased))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, index])

  return (
    <span ref={ref} className="skill-score">
      {val}
    </span>
  )
}

export default function Skills() {
  const listRef = useRef(null)

  // 光标接近的群体剪切反应：仅精确指针设备启用，行随光标上下位置反向轻移
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let py = 0
    let active = false

    const frame = () => {
      const rows = list.children
      for (const row of rows) {
        const r = row.getBoundingClientRect()
        const cy = r.top + r.height / 2
        const d = Math.abs(py - cy)
        const radius = 160
        if (d < radius) {
          const falloff = 1 - d / radius
          const dir = py < cy ? 1 : -1
          row.style.setProperty('--pull', `${(dir * 9 * falloff * falloff).toFixed(2)}px`)
        } else {
          row.style.setProperty('--pull', '0px')
        }
      }
      raf = active ? requestAnimationFrame(frame) : 0
    }
    const onMove = (e) => {
      py = e.clientY
    }
    const start = () => {
      if (!raf && active) raf = requestAnimationFrame(frame)
    }
    const onEnter = (e) => {
      py = e.clientY
      active = true
      start()
    }
    const onLeave = () => {
      active = false
      for (const row of list.children) row.style.setProperty('--pull', '0px')
    }
    list.addEventListener('pointerenter', onEnter)
    list.addEventListener('pointerleave', onLeave)
    list.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      list.removeEventListener('pointerenter', onEnter)
      list.removeEventListener('pointerleave', onLeave)
      list.removeEventListener('pointermove', onMove)
      onLeave()
    }
  }, [])

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
              <h2 className="section-title">
                <SplitText text="技能" />
              </h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className="skill-sw" ref={listRef}>
            {skills.items.map((it, i) => {
              const hasScore = typeof it.score === 'number'
              const pos = hasScore ? it.score : LEVEL_POS[it.level] ?? 60
              return (
                <div
                  className="skill-row"
                  key={it.name}
                  style={{ '--i': i, '--score': pos }}
                >
                  <span className="skill-idx">{`S—${String(i + 1).padStart(2, '0')}`}</span>
                  <span className="skill-name">{it.name}</span>
                  <span className="skill-field">{it.field}</span>
                  <span className="skill-gauge">
                    <span className="skill-rail">
                      <span className="skill-rail-fill" />
                    </span>
                    {hasScore && <ScoreNum to={it.score} index={i} />}
                  </span>
                  <span
                    className={`skill-level${LEVEL_CLASS[it.level] ? ` ${LEVEL_CLASS[it.level]}` : ''}`}
                  >
                    {it.level}
                  </span>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
