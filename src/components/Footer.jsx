import Reveal from './Reveal'
import { copyText } from '../lib/clipboard'
import { showToast } from '../lib/toast'

export default function Footer() {
  const onCopyEmail = async () => {
    const ok = await copyText('2425698138@qq.com')
    showToast(ok ? '邮箱已复制' : '复制失败：2425698138@qq.com')
  }

  return (
    <footer className="footer">
      <Reveal>
        <div className="container footer-inner">
        <p className="footer-copy">© 2026 cmchen · 用 React 构建</p>
        <div className="footer-links">
          <a
            className="footer-link"
            href="https://github.com/shi-tou1234"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <button
            type="button"
            className="footer-link"
            onClick={onCopyEmail}
            aria-label="复制邮箱 2425698138@qq.com"
          >
            邮箱
          </button>
          <a
            className="footer-link"
            href="https://shi-tou1234.github.io/cmchen-blog/"
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
    </footer>
  )
}
