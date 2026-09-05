import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'
import Magnetic from './Magnetic'
import contact from '../data/content/contact.json'
import { copyText } from '../lib/clipboard'
import { showToast } from '../lib/toast'

// 终章落幕：保留原有复制邮箱/GitHub/meta 全部信息，叠加四件收束装置——
// ① 巨型 email 描边跑马灯带：悬停停住并填充为实心，点击复制（复用全局 marquee-scroll 关键帧）
// ② 主按钮加磁吸（复用 Hero 同款 Magnetic）③ meta 行嵌入实时本地时钟 ④ kicker 呼吸状态点
// 文案全部来自后台「联系」可编辑 JSON（email/kicker/meta 等），无硬编码；样式内嵌于组件
const STYLE = `
.contact-kicker{display:inline-flex;align-items:center;gap:10px}
.fin-dot{width:8px;height:8px;border-radius:50%;background:var(--accent-2);opacity:.85;flex:none;
  animation:fin-pulse 2.4s ease-out infinite}
@keyframes fin-pulse{
  0%{box-shadow:0 0 0 0 rgba(201,185,152,.4)}
  70%{box-shadow:0 0 0 10px rgba(201,185,152,0)}
  100%{box-shadow:0 0 0 0 rgba(201,185,152,0)}
}
.fin-clock{font-family:var(--font-mono);font-variant-numeric:tabular-nums;letter-spacing:.08em;color:var(--text)}
.fin-band{display:block;width:100%;margin-top:clamp(56px,8vw,110px);padding:26px 0;
  background:none;border:0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  cursor:pointer;overflow:hidden;text-align:inherit;font:inherit;color:inherit;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
.fin-band-track{display:flex;align-items:center;gap:56px;width:max-content;
  animation:marquee-scroll 22s linear infinite;will-change:transform}
.fin-band:hover .fin-band-track{animation-play-state:paused}
.fin-band-cell{display:flex;align-items:center;gap:56px;white-space:nowrap;
  font-size:clamp(52px,10vw,130px);font-weight:800;letter-spacing:-.02em;line-height:1.15;
  color:transparent;-webkit-text-stroke:1.5px rgba(242,242,242,.3);
  transition:color .4s ease,-webkit-text-stroke-color .4s ease}
.fin-band:hover .fin-band-cell{color:var(--text);-webkit-text-stroke-color:transparent}
.fin-band-sep{width:10px;height:10px;background:var(--border-strong);transform:rotate(45deg);flex:none}
@media (prefers-reduced-motion: reduce){
  .fin-dot{animation:none}
  .fin-band-track{animation:none}
}
@media (max-width:760px){
  .fin-band{padding:18px 0;margin-top:48px}
  .fin-band-track,.fin-band-cell{gap:32px}
}
`

const pad = (n) => String(n).padStart(2, '0')

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // 实时本地时钟：每秒一跳，卸载时清理
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const onCopyEmail = async () => {
    const ok = await copyText(contact.email)
    showToast(ok ? '邮箱已复制' : `复制失败：${contact.email}`)
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2200)
  }

  const seq = Array(6).fill(contact.email)

  return (
    <section className="contact" id="contact">
      <span className="sec-ghost" aria-hidden="true">CONTACT</span>
      <style>{STYLE}</style>
      <div className="contact-glow contact-glow-a" aria-hidden="true" />
      <div className="contact-glow contact-glow-b" aria-hidden="true" />
      <div className="container contact-inner">
        <Reveal>
          <div className="contact-kicker-row">
            <p className="eyebrow contact-kicker" style={{ margin: 0 }}>
              <span className="fin-dot" aria-hidden="true" />
              <span>{contact.kicker}</span>
            </p>
            <span className="line" aria-hidden="true" />
          </div>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="contact-title">
            {contact.titleLines.map((line) => (
              <span key={line} className="contact-line">
                {line}
              </span>
            ))}
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <div className="contact-actions">
            <Magnetic>
              <button
                type="button"
                className={`contact-btn${copied ? ' is-copied' : ''}`}
                onClick={onCopyEmail}
                aria-label={`复制邮箱 ${contact.email}`}
              >
                {contact.email}
                <span className="arrow">
                  <Arrow />
                </span>
              </button>
            </Magnetic>
            <a
              className="contact-ghost"
              href={contact.githubButton.href}
              target="_blank"
              rel="noreferrer"
            >
              {contact.githubButton.label}
            </a>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <div className="contact-meta">
            <span>{contact.metaLeft}</span>
            <i />
            <span className="fin-clock">{time}</span>
            <i />
            <span>{contact.metaRight}</span>
          </div>
        </Reveal>
      </div>
      <button
        type="button"
        className="fin-band"
        onClick={onCopyEmail}
        aria-label={`复制邮箱 ${contact.email}`}
      >
        <span className="fin-band-track" aria-hidden="true">
          {[...seq, ...seq].map((mail, i) => (
            <span className="fin-band-cell" key={i}>
              <span>{mail}</span>
              <span className="fin-band-sep" />
            </span>
          ))}
        </span>
      </button>
    </section>
  )
}
