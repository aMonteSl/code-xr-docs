import { useScroll, useSpring } from 'framer-motion';
import { useRef } from 'react';

export const useScrollProgress = (options = {}) => {
  const containerRef = useRef(null);
  
  const {
    stiffness = 100,
    damping = 30,
    restDelta = 0.001
  } = options;

  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness,
    damping,
    restDelta
  });

  return {
    containerRef,
    scrollYProgress,
    scaleX,
    progress: scrollYProgress
  };
};