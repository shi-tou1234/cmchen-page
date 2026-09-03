import Reveal from './Reveal'
import site from '../data/content/site.json'
import contact from '../data/content/contact.json'
import blog from '../data/content/blog.json'
import { copyText } from '../lib/clipboard'
import { showToast } from '../lib/toast'

// 落幕 wordmark：巨型站名（site.logo 后台可编辑）即「回到顶部」按钮——
// 上方保留原有 copy＋四链接一行不减；悬停字距松开，小字提示与巨字构成大小对比
// 样式内嵌于组件，避免改动全局 index.css（.footer/.footer-link 等全局样式继续复用）
const STYLE = `
.footer-word{display:block;text-align:center;margin-top:58px;text-decoration:none;
  font-size:clamp(78px,16vw,240px);font-weight:800;line-height:.92;letter-spacing:-.045em;
  color:var(--text);user-select:none;
  transition:letter-spacing .5s var(--ease-out)}
.footer-word:hover{letter-spacing:-.018em}
.footer-word-dot{color:var(--text-faint);transition:color .3s ease}
.footer-word:hover .footer-word-dot{color:var(--accent-2)}
.footer-top-hint{margin-top:16px;text-align:center;font-family:var(--font-mono);
  font-size:11px;letter-spacing:.32em;color:var(--text-faint)}
@media (max-width:760px){
  .footer-word{margin-top:42px}
}
`

export default function Footer() {
  const onCopyEmail = async () => {
    const ok = await copyText(contact.email)
    showToast(ok ? '邮箱已复制' : `复制失败：${contact.email}`)
  }

  return (
    <footer className="footer">
      <style>{STYLE}</style>
      <Reveal>
        <div className="container footer-inner">
          <p className="footer-copy">{site.footerCopy}</p>
          <div className="footer-links">
            <a
              className="footer-link"
              href={contact.githubButton.href}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <button
              type="button"
              className="footer-link"
              onClick={onCopyEmail}
              aria-label={`复制邮箱 ${contact.email}`}
            >
              邮箱
            </button>
            <a
              className="footer-link"
              href={blog.url}
              target="_blank"
              rel="noreferrer"
            >
              博客
            </a>
            <a className="footer-link" href="#top">
              回到顶部
            </a>
          </div>
        </div>
      </Reveal>
      <Reveal delay={90}>
        <a className="footer-word" href="#top" aria-label="回到顶部">
          {site.logo}
          <span className="footer-word-dot">.</span>
        </a>
        <p className="footer-top-hint" aria-hidden="true">↑ BACK TO TOP</p>
      </Reveal>
    </footer>
  )
}
