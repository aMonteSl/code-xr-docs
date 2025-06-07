import React from 'react';
import { motion } from 'framer-motion';

const HowToUseSection = ({ goToSlide }) => {
  const steps = [
    {
      number: '01',
      icon: '⚡',
      title: 'Install Extension',
      description: 'Get Code-XR from the VS Code Marketplace with a single click. No additional configuration needed.'
    },
    {
      number: '02',
      icon: '📂',
      title: 'Open Your Project',
      description: 'Open any JavaScript, TypeScript, or Python project in VS Code. Code-XR works with existing projects.'
    },
    {
      number: '03',
      icon: '🎯',
      title: 'Right-Click & Visualize',
      description: 'Right-click on any file or folder and select "Visualize in XR" from the context menu.'
    },
    {
      number: '04',
      icon: '🥽',
      title: 'Explore in XR',
      description: 'Experience your code in immersive 3D. Use VR/AR devices or explore on your desktop screen.'
    }
  ];

  return (
    <div className="slide howto-slide" id="howto">
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        How to <span className="brand">Use</span>
      </motion.h2>

      <motion.div 
        className="steps-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            className="step-item"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.3 + index * 0.15,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ x: 10 }}
          >
            <div className="step-number">{step.number}</div>
            <div className="step-content">
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Next Section Arrow */}
      <div 
        className="next-section-arrow" 
        onClick={() => goToSlide(4)}
      >
        <div className="arrow-icon">↓</div>
      </div>
    </div>
  );
};

export default HowToUseSection;