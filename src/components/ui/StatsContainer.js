import React from 'react';
import { motion } from 'framer-motion';

const StatsContainer = ({ 
  stats, 
  loading = false, 
  error = null,
  className = '',
  layout = 'horizontal' // 'horizontal' | 'vertical' | 'grid'
}) => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (error) {
    return (
      <motion.div 
        className={`stats-error ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="error-icon">⚠️</span>
        <span className="error-text">{error}</span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`stats-container ${layout} ${loading ? 'loading' : ''} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label || index}>
          <motion.div
            className="stat-item"
            variants={itemVariants}
          >
            <div className={`stat-number ${loading || stat.value === '--' ? 'loading' : ''}`}>
              {loading ? (
                <div className="skeleton-text">...</div>
              ) : (
                stat.value
              )}
            </div>
            <div className="stat-label">{stat.label}</div>
            {stat.sublabel && (
              <div className="stat-sublabel">{stat.sublabel}</div>
            )}
          </motion.div>
          
          {/* Separador entre items (solo para layout horizontal) */}
          {layout === 'horizontal' && index < stats.length - 1 && (
            <div className="stats-separator" />
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
};

export default StatsContainer;