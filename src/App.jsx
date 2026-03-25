import React from 'react'
import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import LatestRelease from './sections/LatestRelease'
import Features from './sections/Features'
import Gallery from './sections/Gallery'
import RealProjects from './sections/RealProjects'
import Install from './sections/Install'
import QuickStartGuide from './sections/QuickStartGuide'
import Technologies from './sections/Technologies'
import Downloads from './sections/Downloads'
import Author from './sections/Author'
import Footer from './sections/Footer'
import FloatingActionButton from './components/FloatingActionButton'

function App() {
  return (
    <div className="site-shell">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-neon-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <LatestRelease />
        <Features />
        <Gallery />
        <RealProjects />
        <Install />
        <QuickStartGuide />
        <Technologies />
        <Downloads />
        <Author />
      </main>
      <Footer />
      <FloatingActionButton />
    </div>
  )
}

export default App
