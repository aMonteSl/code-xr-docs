import React from 'react'
import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import Features from './sections/Features'
import Gallery from './sections/Gallery'
import Install from './sections/Install'
import QuickStartGuide from './sections/QuickStartGuide'
import Technologies from './sections/Technologies'
import Footer from './sections/Footer'

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <Features />
      <Gallery />
      <Install />
      <QuickStartGuide />
      <Technologies />
      <Footer />
    </div>
  )
}

export default App
