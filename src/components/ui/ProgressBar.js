import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ 
  progress, 
  className = '',
  showPercentage = false,
  color = 'var(--accent-gradient)',
  height = '3px'
}) => {
  return (
    <>
      {/* ✨ BARRA DE PROGRESO FIJA EN LA PARTE SUPERIOR */}
      <motion.div 
        className={`progress-bar-fixed ${className}`}
        style={{ 
          scaleX: progress,
          background: color,
          height: height,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          transformOrigin: '0%',
          zIndex: 2000
        }}
        initial={{ scaleX: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 40
        }}
      />
      
      {showPercentage && (
        <motion.div 
          className="progress-percentage"
          style={{
            position: 'fixed',
            top: '10px',
            right: '20px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            zIndex: 2001,
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(progress.get ? progress.get() * 100 : progress * 100)}%
        </motion.div>
      )}
    </>
  );
};

export default ProgressBar;