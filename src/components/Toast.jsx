import { useEffect, useState } from 'react'
import { EVENT } from '../lib/toast'

export default function Toast() {
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const on = (e) => setMsg(e.detail)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2200)
    return () => clearTimeout(t)
  }, [msg])

  if (!msg) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  )
}
