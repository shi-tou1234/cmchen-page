import Reveal from './Reveal'
import site from '../data/content/site.json'
import contact from '../data/content/contact.json'
import blog from '../data/content/blog.json'
import { copyText } from '../lib/clipboard'
import { showToast } from '../lib/toast'

export default function Footer() {
  const onCopyEmail = async () => {
    const ok = await copyText(contact.email)
    showToast(ok ? '邮箱已复制' : `复制失败：${contact.email}`)
  }

  return (
    <footer className="footer">
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
    </footer>
  )
}
