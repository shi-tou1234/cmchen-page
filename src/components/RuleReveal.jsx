import { useEffect, useRef } from 'react'

// 全宽发丝分隔线：进视口后从左向右展开（scaleX 0→1，expo 缓动），
// 复刻参考站的 reveal-divider 仪式感；一次性触发，展开后不再回收
export default function RuleReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-inview')
          io.disconnect()
        }
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return <hr ref={ref} className="rule-reveal" aria-hidden="true" />
}
