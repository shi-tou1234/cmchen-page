import { useState } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'
import contact from '../data/content/contact.json'
import { copyText } from '../lib/clipboard'
import { showToast } from '../lib/toast'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const onCopyEmail = async () => {
    const ok = await copyText(contact.email)
    showToast(ok ? '邮箱已复制' : `复制失败：${contact.email}`)
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2200)
  }

  return (
    <section className="contact" id="contact">
      <span className="sec-ghost" aria-hidden="true">CONTACT</span>
      <div className="contact-glow contact-glow-a" aria-hidden="true" />
      <div className="contact-glow contact-glow-b" aria-hidden="true" />
      <div className="container contact-inner">
        <Reveal>
          <div className="contact-kicker-row">
            <p className="eyebrow contact-kicker" style={{ margin: 0 }}>
              {contact.kicker}
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
            <span>{contact.metaRight}</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
