import { useState } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'
import { copyText } from '../lib/clipboard'
import { showToast } from '../lib/toast'

const EMAIL = '2425698138@qq.com'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const onCopyEmail = async () => {
    const ok = await copyText(EMAIL)
    showToast(ok ? '邮箱已复制' : `复制失败：${EMAIL}`)
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2200)
  }

  return (
    <section className="contact" id="contact">
      <div className="contact-glow contact-glow-a" aria-hidden="true" />
      <div className="contact-glow contact-glow-b" aria-hidden="true" />
      <div className="container contact-inner">
        <Reveal>
          <p className="eyebrow contact-kicker">Contact · 05</p>
        </Reveal>
        <Reveal delay={90}>
          <h2 className="contact-title">
            有想法？
            <br />
            让我们聊聊。
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <div className="contact-actions">
            <button
              type="button"
              className={`contact-btn${copied ? ' is-copied' : ''}`}
              onClick={onCopyEmail}
              aria-label={`复制邮箱 ${EMAIL}`}
            >
              {EMAIL}
              <span className="arrow">
                <Arrow />
              </span>
            </button>
            <a
              className="contact-ghost"
              href="https://github.com/shi-tou1234"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <div className="contact-meta">
            <span>浙江 · 杭州</span>
            <i />
            <span>欢迎交流硬件 / Web / AI</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
