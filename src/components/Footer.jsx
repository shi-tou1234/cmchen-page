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
.footer-word{display:block;text-align:center;margin-top:64px;text-decoration:none;
  font-family:var(--font-display);font-size:clamp(70px,15vw,230px);font-weight:500;line-height:.94;
  letter-spacing:-.02em;user-select:none;transition:letter-spacing .55s var(--ease-out)}
.footer-word:hover{letter-spacing:.004em}
/* 每个字母自带渐变裁剪：字母动、渐变跟着动，悬停不再「消失」；
   --i 驱动色带连续偏移与整词波浪延迟 */
.fw-ch{display:inline-block;
  background:linear-gradient(108deg,var(--accent-2) 6%,#f6f1e6 40%,var(--accent) 66%,var(--accent-2) 94%);
  background-size:260% 100%;
  background-position-x:calc(-40% + var(--i)*16%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  transition:transform .5s var(--ease-out),filter .4s ease;
  animation:word-sheen 9s ease-in-out infinite alternate}
/* 整词悬停：从左到右的波浪抬升 */
.footer-word:hover .fw-ch{transform:translateY(-12%);transition-delay:calc(var(--i)*32ms)}
/* 单字悬停：更深的跳起 + 提亮 */
.fw-ch:hover{transform:translateY(-20%) scale(1.04);filter:brightness(1.5);transition-delay:0ms}
@keyframes word-sheen{to{background-position-x:calc(-40% + var(--i)*16% + 55%)}}
.footer-word-dot{color:var(--accent-2);transition:color .3s ease}
.footer-word:hover .footer-word-dot{color:var(--accent)}
.footer-top-hint{margin-top:18px;text-align:center;font-family:var(--font-mono);
  font-size:10.5px;letter-spacing:.34em;color:var(--text-faint)}
@media (prefers-reduced-motion: reduce){
  .fw-ch{animation:none}
}
@media (max-width:760px){
  .footer-word{margin-top:44px}
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
          {/* 逐字 span：自带渐变裁剪 + --i 序号（色带偏移/波浪延迟），悬停单字深跳 */}
          {site.logo.split('').map((ch, i) => (
            <span className="fw-ch" key={i} style={{ '--i': i }} aria-hidden="true">
              {ch}
            </span>
          ))}
          <span className="footer-word-dot">.</span>
        </a>
        <p className="footer-top-hint" aria-hidden="true">↑ BACK TO TOP</p>
      </Reveal>
    </footer>
  )
}
