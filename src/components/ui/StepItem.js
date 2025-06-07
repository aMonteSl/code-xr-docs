import React from 'react';
import { motion } from 'framer-motion';

const StepItem = ({ 
  number, 
  icon, 
  title, 
  description, 
  delay = 0,
  onClick = null,
  className = '',
  isActive = false
}) => {
  const stepVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        delay: delay,
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      className={`step-item ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''} ${className}`}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? { x: 10 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      <div className="step-number">
        {number}
      </div>
      
      <div className="step-content">
        <div className="step-icon">
          {typeof icon === 'string' ? icon : icon}
        </div>
        <h3 className="step-title">{title}</h3>
        <p className="step-description">{description}</p>
      </div>
      
      {/* Connection line */}
      <div className="step-connector" />
    </motion.div>
  );
};

export default StepItem;