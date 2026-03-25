import React, { useState, useEffect } from 'react';
import { latestRelease } from '../content/releaseContent';

const AnimatedDescription = () => {
  const descriptions = latestRelease.copyBlocks.heroDescriptions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % descriptions.length);
        setIsVisible(true);
      }, 800); // 800ms for fade out transition
    }, 7000); // Change every 7 seconds (6+ seconds visible + transition time)

    return () => clearInterval(interval);
  }, [descriptions.length]);

  return (
    <div className="flex h-24 items-center justify-center sm:h-20 md:h-16">
      <p className={`mx-auto max-w-3xl text-lg leading-relaxed text-gray-300 transition-all duration-700 ease-in-out transform sm:text-xl md:text-2xl ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {descriptions[currentIndex]}
      </p>
    </div>
  );
};

export default AnimatedDescription;
