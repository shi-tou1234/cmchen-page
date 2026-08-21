import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'

const BLOG_URL = 'https://shi-tou1234.github.io/cmchen-blog/'

// 运行时抓取博客首页，解析最新的 4 篇（标题 / 分类 / 链接），保持实时
async function fetchLatestPosts() {
  const res = await fetch(BLOG_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const cards = Array.from(doc.querySelectorAll('article.post-card')).slice(0, 4)
  return cards
    .map((card) => {
      const title = card.querySelector('.post-card__title')?.textContent?.trim() ?? ''
      const cat = (card.querySelector('.post-card__tag')?.textContent ?? '')
        .replace(/^#/, '')
        .trim()
      const raw =
        card.querySelector('a.post-card__stretched-link')?.getAttribute('href') ?? ''
      const href = raw.startsWith('http')
        ? raw
        : new URL(raw, BLOG_URL).href
      return { title, cat, href }
    })
    .filter((p) => p.title && p.href && p.href !== BLOG_URL)
}

export default function Blog() {
  const [posts, setPosts] = useState(null) // null = 加载中
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetchLatestPosts()
      .then((list) => {
        if (alive) setPosts(list)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className="section" id="blog">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">Blog</p>
              <h2 className="section-title">最新文章</h2>
              <p className="section-desc">记录学习、思考与生活片段。</p>
            </div>
            <a
              className="view-all"
              href={BLOG_URL}
              target="_blank"
              rel="noreferrer"
            >
              全部文章
              <span className="arrow">
                <Arrow />
              </span>
            </a>
          </div>
        </Reveal>
        <div className="blog-list">
          {!posts && !error && (
            <div className="post post--status">正在加载最新文章…</div>
          )}
          {error && (
            <div className="post post--status">
              暂时无法获取最新文章，可从右侧查看全部文章
            </div>
          )}
          {posts &&
            posts.map((post, i) => (
              <Reveal key={post.href} delay={i * 80}>
                <a
                  className="post"
                  href={post.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="post-cat">{post.cat}</span>
                  <span className="post-title">{post.title}</span>
                  <span className="arrow">
                    <Arrow />
                  </span>
                </a>
              </Reveal>
            ))}
        </div>
      </div>
    </section>
  )
}