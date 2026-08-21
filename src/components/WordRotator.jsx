import { useEffect, useState } from 'react'

export default function WordRotator({ words }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((v) => (v + 1) % words.length), 2800)
    return () => clearInterval(id)
  }, [words.length])

  return (
    <span className="word-roller" aria-label={words[index]}>
      <span
        className="word-track"
        aria-hidden="true"
        style={{ transform: `translateY(${-index * 1.4}em)` }}
      >
        {words.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </span>
    </span>
  )
}
