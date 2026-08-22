import { lazy, Suspense, useEffect, useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import StatsStrip from './components/StatsStrip'
import About from './components/About'
import Awards from './components/Awards'
import Projects from './components/Projects'
import Blog from './components/Blog'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CursorGlow from './components/CursorGlow'
import NebulaBackground from './components/NebulaBackground'
import Toast from './components/Toast'

const AdminApp = lazy(() => import('./admin/AdminApp'))

// hash 路由：#/admin 进入后台（GitHub Pages 静态托管无需 404 兜底）
function useIsAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(() =>
    window.location.hash.toLowerCase().startsWith('#/admin')
  )
  useEffect(() => {
    const on = () =>
      setIsAdmin(window.location.hash.toLowerCase().startsWith('#/admin'))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return isAdmin
}

export default function App() {
  const isAdmin = useIsAdminRoute()

  if (isAdmin) {
    return (
      <Suspense fallback={<div className="admin-loading">正在加载后台…</div>}>
        <AdminApp />
      </Suspense>
    )
  }

  return (
    <>
      <NebulaBackground />
      <CursorGlow />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <StatsStrip />
        <About />
        <Awards />
        <Projects />
        <Blog />
      </main>
      <Contact />
      <Footer />
      <Toast />
    </>
  )
}
