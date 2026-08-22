import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'
import githubData from '../data/github.json'
import statsContent from '../data/content/stats.json'

const GH_API = 'https://api.github.com'
const GH_USER = 'shi-tou1234'
const CACHE_KEY = 'cmchen-page:repos'
const CACHE_TTL = 60 * 60 * 1000

function readCache() {
  try {
    const { repos, at } = JSON.parse(localStorage.getItem(CACHE_KEY) || '')
    if (Number.isFinite(repos) && repos > 0 && Date.now() - at < CACHE_TTL) return repos
  } catch {
    /* 缓存不可用就直接请求 */
  }
  return null
}

// 先显示构建时快照，再运行时拉最新值；失败保持原数字不闪错
function useRepoCount() {
  const [repos, setRepos] = useState(() => readCache() ?? githubData.repos)

  useEffect(() => {
    if (readCache() !== null) return
    let cancelled = false
    fetch(`${GH_API}/users/${GH_USER}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const n = data && data.public_repos
        if (cancelled || !Number.isFinite(n) || n <= 0) return
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ repos: n, at: Date.now() }))
        } catch {
          /* 隐私模式等写入失败可忽略 */
        }
        setRepos(n)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return repos
}

function CountUp({ value, pad, suffix }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        if (reduced) {
          setN(value)
          return
        }
        const dur = 1500
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min((now - start) / dur, 1)
          setN(Math.round(value * (1 - Math.pow(1 - t, 3))))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value])

  return (
    <span className="stat-num" ref={ref}>
      {String(n).padStart(pad, '0')}
      <em>{suffix}</em>
    </span>
  )
}

export default function StatsStrip() {
  const repos = useRepoCount()
  const stats = [
    { value: repos, pad: 2, suffix: '+', label: '开源项目' },
    ...statsContent.items.map((s) => ({
      value: Number(s.value) || 0,
      pad: Number(s.pad) || 1,
      suffix: s.suffix,
      label: s.label,
    })),
  ]

  return (
    <div className="stats-strip">
      <div className="container">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 110} variant="up">
            <div className="stat-cell">
              <CountUp value={s.value} pad={s.pad} suffix={s.suffix} />
              <span className="stat-label">{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
