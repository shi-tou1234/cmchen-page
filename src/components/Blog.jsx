import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import Arrow from './Arrow'
import SplitText from './SplitText'
import Typewriter from './Typewriter'
import blog from '../data/content/blog.json'

const CACHE_KEY = 'cmchen-page:blog-posts'
const CACHE_TTL = 10 * 60 * 1000

function readCache() {
  try {
    const { posts, at } = JSON.parse(localStorage.getItem(CACHE_KEY) || '')
    if (Array.isArray(posts) && posts.length && Date.now() - at < CACHE_TTL) return posts
  } catch {
    /* 缓存不可用就直接请求 */
  }
  return null
}

// 运行时抓取博客首页，解析最新的 4 篇（标题 / 分类 / 链接），保持实时
async function fetchLatestPosts() {
  // 8s 超时：弱网下不让 loading 态无限挂起（旧浏览器无此 API 则不设超时）
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
    ? AbortSignal.timeout(8000)
    : undefined
  const res = await fetch(blog.url, { cache: 'no-store', signal })
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
        : new URL(raw, blog.url).href
      return { title, cat, href }
    })
    .filter((p) => p.title && p.href && p.href !== blog.url)
}

export default function Blog() {
  // 惰性初始化：挂载即有缓存可用；null = 加载中
  const [posts, setPosts] = useState(() => readCache())
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetchLatestPosts()
      .then((list) => {
        if (!alive || !list.length) return
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ posts: list, at: Date.now() }))
        } catch {
          /* 隐私模式等写入失败可忽略 */
        }
        setPosts(list)
        setError(false)
      })
      .catch(() => {
        // 失败时置错误态；渲染层只在没有任何内容（连缓存都没有）时才显示错误文案
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className="section" id="blog">
      <span className="sec-ghost" aria-hidden="true">BLOG</span>
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="sec-no">05</div>
              <p className="eyebrow">Blog</p>
              <h2 className="section-title">
                <SplitText text="最新文章" />
              </h2>
              <p className="section-desc">
                <Typewriter text={blog.typewriter} speed={85} />
              </p>
            </div>
            <span className="sec-rule" aria-hidden="true" />
            <a
              className="view-all"
              href={blog.url}
              target="_blank"
              rel="noreferrer"
            >
              {blog.viewAllLabel}
              <span className="arrow">
                <Arrow />
              </span>
            </a>
          </div>
        </Reveal>
        <div className="blog-list">
          {!posts && !error && (
            <div className="post post--status">{blog.loadingText}</div>
          )}
          {error && !posts && (
            <div className="post post--status">{blog.errorText}</div>
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
                  <span className="post-idx">{`P—${String(i + 1).padStart(2, '0')}`}</span>
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
