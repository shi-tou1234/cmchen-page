import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Projects from './components/Projects'
import Blog from './components/Blog'
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
        <Projects />
        <Blog />
      </main>
      <Footer />
    </>
  )
}
