import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  color = '#3b82f6',
  priority = 'medium', // 'high' | 'medium' | 'low'
  delay = 0,
  onClick = null,
  className = '',
  interactive = true
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: delay,
        type: "spring",
        stiffness: 100
      }
    }
  };

  const hoverVariants = interactive ? {
    y: -4,
    transition: {
      type: "spring",
      stiffness: 300
    }
  } : {};

  return (
    <motion.div
      className={`feature-card priority-${priority} ${onClick ? 'clickable' : ''} ${className}`}
      style={{ '--accent-color': color }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverVariants}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      <div className="feature-icon">
        {typeof icon === 'string' ? icon : icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
      
      {/* Accent line */}
      <div 
        className="feature-accent" 
        style={{ background: color }}
      />
    </motion.div>
  );
};

export default FeatureCard;