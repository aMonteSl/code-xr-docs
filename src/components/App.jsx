import React from 'react';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Gallery from './sections/Gallery';
import Install from './sections/Install';
import SectionDivider from './components/SectionDivider';

const App = () => {
  return (
    <div>
      <Hero />
      <SectionDivider direction="down" />
      <Features />
      <SectionDivider direction="up" />
      <Gallery />
      <SectionDivider direction="down" />
      <Install />
    </div>
  );
};

export default App;