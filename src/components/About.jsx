import { useEffect, useRef } from 'react'
import Reveal from './Reveal'
import SplitText from './SplitText'
import about from '../data/content/about.json'

// 大字逐字点亮（scroll-scrub）：intro 解析成「字符/词组 + 是否强调」序列，
// 滚动经过段落时从暗到亮逐字擦洗点亮；<em> 段点亮时连荧光笔下划线一起显出
// （em 自身持有 opacity，文字与高亮同步点亮）。中文无空格故按字拆分，
// 连续的拉丁字母/数字合并为一个词组避免单词被逐字母拆断。
// 安全性：不再渲染任何原始 HTML——只取解析后节点的 textContent 与 em/b/strong/i/br 结构，
// 与原 sanitizeHtml 白名单等效且无注入面。
const WORD_RUN = /[A-Za-z0-9%/.+-]+/g

function parseIntro(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out = []
  const pushText = (text, em) => {
    if (!text) return
    let last = 0
    for (const m of text.matchAll(WORD_RUN)) {
      Array.from(text.slice(last, m.index)).forEach((c) => out.push({ c, em }))
      out.push({ c: m[0], em, run: true })
      last = m.index + m[0].length
    }
    Array.from(text.slice(last)).forEach((c) => out.push({ c, em }))
  }
  const walk = (node, em) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        pushText(child.textContent, em)
      } else if (child.nodeType === 1) {
        if (child.tagName === 'BR') {
          out.push({ br: true })
          return
        }
        walk(child, em || ['EM', 'B', 'STRONG', 'I'].includes(child.tagName))
      }
    })
  }
  walk(doc.body, false)
  return out
}

export default function About() {
  const bigRef = useRef(null)
  const tokens = parseIntro(about.intro)

  useEffect(() => {
    const p = bigRef.current
    if (!p) return
    const units = Array.from(p.querySelectorAll('.aw'))
    if (!units.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      p.classList.add('aw-all')
      return
    }

    // 段落在文档中的绝对位置：字体加载/窗口尺寸变化后重测（Nav 同款先例）
    let docTop = 0
    let height = 1
    const measure = () => {
      docTop = p.getBoundingClientRect().top + window.scrollY
      height = p.offsetHeight || 1
    }

    const last = new Array(units.length).fill(-1)
    let raf = 0
    let active = false

    const update = () => {
      raf = 0
      const y = window.__smoothY ?? window.scrollY
      const vh = window.innerHeight
      // 段首到视口 88% 处开始，段尾到 42% 处点亮完毕
      const start = docTop - vh * 0.88
      const end = docTop + height - vh * 0.42
      const prog = end > start ? Math.min(1, Math.max(0, (y - start) / (end - start))) : 1
      const lit = prog * units.length
      for (let i = 0; i < units.length; i++) {
        const v = Math.min(1, Math.max(0.16, lit - i))
        if (Math.abs(v - last[i]) > 0.01) {
          units[i].style.opacity = String(v)
          last[i] = v
        }
      }
      if (active) raf = requestAnimationFrame(update)
    }

    // 仅当段落进入视口邻域时才驱动 rAF：接得住 lerp 尾巴，也省全局帧
    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting
        if (active && !raf) raf = requestAnimationFrame(update)
      },
      { rootMargin: '35% 0px 35% 0px' }
    )
    io.observe(p)
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener('resize', measure)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section className="section" id="about">
      <span className="sec-ghost" aria-hidden="true">ABOUT</span>
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
              <p className="about-big" ref={bigRef}>
                {tokens.map((tk, i) => {
                  if (tk.br) return <br key={i} />
                  return tk.em ? (
                    <em className="aw" key={i}>
                      {tk.c}
                    </em>
                  ) : (
                    <span className="aw" key={i}>
                      {tk.c}
                    </span>
                  )
                })}
              </p>
            </Reveal>
          </div>

          <Reveal delay={180} variant="right">
            <div className="about-card">
              <ul className="about-facts">
                {about.facts.map((f, i) => (
                  <li key={f.k} className="fact-row" style={{ '--i': i }}>
                    <b>{f.k}</b>
                    <span>{f.v}</span>
                  </li>
                ))}
              </ul>
              <p className="about-note">{about.note}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
