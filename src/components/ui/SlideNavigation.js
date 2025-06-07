import React from 'react';
import { motion } from 'framer-motion';

const SlideNavigation = ({ 
  currentSlide, 
  totalSlides, 
  onSlideChange, 
  showCounter = true,
  className = '' 
}) => {
  return (
    <>
      {/* Navigation Dots */}
      <div className={`slide-navigation ${className}`}>
        {Array.from({ length: totalSlides }, (_, i) => (
          <motion.button
            key={i}
            className={`nav-dot ${i === currentSlide ? 'active' : ''}`}
            onClick={() => onSlideChange(i)}
            aria-label={`Go to slide ${i + 1}`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: i * 0.05,
              type: "spring",
              stiffness: 300
            }}
          />
        ))}
      </div>

      {/* Slide Counter */}
      {showCounter && (
        <motion.div 
          className="slide-counter"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.span
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentSlide + 1}
          </motion.span>
          <span className="divider">/</span>
          {totalSlides}
        </motion.div>
      )}
    </>
  );
};

export default SlideNavigation;