import React from 'react';
import { motion } from 'framer-motion';

const TechCard = ({ 
  name, 
  description, 
  logo, 
  category,
  color = '#3b82f6',
  delay = 0,
  onClick = null,
  className = ''
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

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <motion.div
      className={`tech-card ${onClick ? 'clickable' : ''} ${className}`}
      style={{ '--tech-color': color }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      <div className="tech-category">{category}</div>
      
      <div className="tech-logo-container">
        <img 
          src={logo} 
          alt={name}
          className="tech-logo"
          onError={handleImageError}
        />
        <div 
          className="tech-icon" 
          style={{ 
            display: 'none', 
            backgroundColor: color 
          }}
        >
          {name.charAt(0)}
        </div>
      </div>
      
      <h3 className="tech-name">{name}</h3>
      <p className="tech-description">{description}</p>
      
      <div 
        className="tech-accent" 
        style={{ background: color }}
      />
    </motion.div>
  );
};

export default TechCard;