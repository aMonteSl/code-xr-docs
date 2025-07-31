import React, { useState, useEffect } from 'react';

const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (scrollPx / winHeightPx) * 100;
      
      setScrollProgress(Math.min(scrolled, 100));
    };

    window.addEventListener('scroll', updateScrollProgress);
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-black/20 z-50 backdrop-blur-sm">
      <div 
        className="h-full bg-gradient-to-r from-neon-blue to-purple-400 transition-all duration-150 ease-out shadow-lg"
        style={{ width: `${scrollProgress}%` }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-purple-400 blur-sm opacity-50"></div>
      </div>
    </div>
  );
};

export default ScrollProgressBar;
