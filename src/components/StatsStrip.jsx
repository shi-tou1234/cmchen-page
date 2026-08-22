import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'

const GITHUB_USER = 'shi-tou1234'

function useGitHubRepoCount() {
  const [count, setCount] = useState(null)
  useEffect(() => {
    fetch(`https://api.github.com/users/${GITHUB_USER}`)
      .then((r) => r.json())
      .then((d) => setCount(d.public_repos ?? 0))
      .catch(() => setCount(0))
  }, [])
  return count
}

const STATS_BUILTIN = [
  { value: 12, pad: 2, suffix: '+', label: '使用中的技术' },
  { value: 2, pad: 1, suffix: '年', label: '持续写代码' },
]

function CountUp({ value, pad, suffix }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    if (value === null) return
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
      {value === null ? '--' : String(n).padStart(pad, '0')}
      <em>{suffix}</em>
    </span>
  )
}

export default function StatsStrip() {
  const repoCount = useGitHubRepoCount()
  const stats = [
    { value: repoCount, pad: 2, suffix: '+', label: '开源项目' },
    ...STATS_BUILTIN,
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
