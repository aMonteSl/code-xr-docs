import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileMenu = ({ 
  isOpen, 
  onClose, 
  currentSlide, 
  onSlideChange 
}) => {
  const navigationItems = [
    { text: 'Welcome', index: 0, icon: '🏠' },
    { text: 'Multimedia', index: 1, icon: '🎬' },
    { text: 'Features', index: 2, icon: '⭐' },
    { text: 'How to Use', index: 3, icon: '📖' },
    { text: 'Benefits', index: 4, icon: '🎯' },
    { text: 'Technologies', index: 5, icon: '⚙️' },
    { text: 'Download', index: 6, icon: '📥' }
  ];

  const externalLinks = [
    { 
      text: 'VS Code Marketplace', 
      url: 'https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr',
      icon: '🛒'
    },
    { 
      text: 'GitHub Repository', 
      url: 'https://github.com/aMonteSl/babiaxr-vscode',
      icon: '💻'
    }
  ];

  const handleNavClick = (index) => {
    onSlideChange(index);
    onClose();
  };

  const handleExternalClick = () => {
    onClose();
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const menuVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="mobile-menu-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            className="mobile-menu"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="mobile-menu-header">
              <div className="mobile-menu-title">
                <h3>Navigation</h3>
              </div>
              <button 
                className="mobile-menu-close"
                onClick={onClose}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="mobile-menu-content">
              {/* Navigation Section */}
              <div className="mobile-menu-section">
                <h3>Sections</h3>
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.text}
                    className={`mobile-nav-link ${currentSlide === item.index ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.index)}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span>{item.text}</span>
                    {currentSlide === item.index && (
                      <motion.span 
                        className="active-indicator"
                        layoutId="activeIndicator"
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--accent-primary)',
                          fontSize: '0.875rem'
                        }}
                      >
                        ●
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* External Links Section */}
              <div className="mobile-menu-section">
                <h3>Links</h3>
                {externalLinks.map((link, index) => (
                  <motion.a
                    key={link.text}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-nav-link external"
                    onClick={handleExternalClick}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={navigationItems.length + index}
                  >
                    <span className="mobile-nav-icon">{link.icon}</span>
                    <span>{link.text}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.7 }}>
                      ↗
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;