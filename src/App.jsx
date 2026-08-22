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

export default function App() {
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
    </>
  )
}
