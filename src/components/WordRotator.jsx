import { useEffect, useState } from 'react'

export default function WordRotator({ words }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!words || words.length < 2) return undefined
    const id = setInterval(() => setIndex((v) => (v + 1) % words.length), 2800)
    return () => clearInterval(id)
  }, [words])

  if (!words || words.length === 0) return null
  const current = words[Math.min(index, words.length - 1)] || ''

  return (
    <span className="word-roller" aria-label={current}>
      <span
        className="word-track"
        aria-hidden="true"
        style={{ transform: `translateY(${-Math.min(index, words.length - 1) * 1.4}em)` }}
      >
        {words.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </span>
    </span>
  )
}
