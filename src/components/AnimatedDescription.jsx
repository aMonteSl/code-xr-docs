import React, { useState, useEffect } from 'react';

const AnimatedDescription = () => {
  const descriptions = [
    "Transform your VS Code into an immersive XR development environment.",
    "Code in virtual reality, visualize data in 3D, and collaborate in mixed reality.",
    "Explore software metrics in spatial XR environments.",
    "Level up static analysis with 3D and AR interfaces."
  ];

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
    <div className="h-20 md:h-16 flex items-center justify-center">
      <p className={`text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed transition-all duration-700 ease-in-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {descriptions[currentIndex]}
      </p>
    </div>
  );
};

export default AnimatedDescription;
