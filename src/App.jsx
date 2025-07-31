import React from 'react'
import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
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
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <Features />
      <Gallery />
      <RealProjects />
      <Install />
      <QuickStartGuide />
      <Technologies />
      <Downloads />
      <Author />
      <Footer />
      <FloatingActionButton />
    </div>
  )
}

export default App
