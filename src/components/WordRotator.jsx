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
        // 步长走 CSS 变量，和 .word-track span 的 height 必须一致，
        // 否则换词时整列会错位半行（不同字体的 em 高度不同，硬编码不可靠）
        style={{
          transform: `translateY(calc(${-Math.min(index, words.length - 1)} * var(--word-step, 1.24em)))`,
        }}
      >
        {words.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </span>
    </span>
  )
}
