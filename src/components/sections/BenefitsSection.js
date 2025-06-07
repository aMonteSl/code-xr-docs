import React from 'react';
import { motion } from 'framer-motion';

const BenefitsSection = ({ goToSlide }) => {
  const benefits = [
    {
      icon: '🧠',
      title: 'Enhanced Understanding',
      description: 'Spatial visualization helps you understand code structure and relationships more intuitively.'
    },
    {
      icon: '⚡',
      title: 'Faster Debugging',
      description: 'Identify bottlenecks and issues quickly through visual patterns and 3D code navigation.'
    },
    {
      icon: '👥',
      title: 'Better Collaboration',
      description: 'Share immersive code experiences with your team for more effective code reviews.'
    },
    {
      icon: '📈',
      title: 'Improved Productivity',
      description: 'Reduce cognitive load and increase development efficiency with intuitive visualizations.'
    }
  ];

  const stats = [
    { number: '3x', label: 'Faster Code Navigation' },
    { number: '45%', label: 'Reduced Debug Time' },
    { number: '2x', label: 'Better Team Understanding' }
  ];

  return (
    <div className="slide benefits-slide" id="benefits">
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="brand">Benefits</span> & Impact
      </motion.h2>

      <motion.div 
        className="benefits-grid"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            className="benefit-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.3 + index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ y: -4 }}
          >
            <div className="benefit-icon">{benefit.icon}</div>
            <h3>{benefit.title}</h3>
            <p>{benefit.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="benefit-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-item"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: 1 + index * 0.1,
              type: "spring",
              stiffness: 150
            }}
          >
            <div className="stat-number">{stat.number}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Next Section Arrow */}
      <div 
        className="next-section-arrow" 
        onClick={() => goToSlide(5)}
      >
        <div className="arrow-icon">↓</div>
      </div>
    </div>
  );
};

export default BenefitsSection;