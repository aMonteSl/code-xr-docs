import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAB = () => {
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.fab-container')) {
        setFabOpen(false);
      }
    };

    if (fabOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fabOpen]);

  const handleLinkClick = (event) => {
    event.stopPropagation();
    setTimeout(() => {
      setFabOpen(false);
    }, 150);
  };

  return (
    <motion.div className="fab-container">
      {fabOpen && (
        <div 
          className="fab-overlay" 
          onClick={(e) => {
            e.stopPropagation();
            setFabOpen(false);
          }}
        />
      )}
      
      <AnimatePresence>
        {fabOpen && (
          <>
            <motion.a
              href="https://github.com/aMonteSl/babiaxr-vscode"
              target="_blank"
              rel="noopener noreferrer"
              className="fab-item fab-github"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 1.05 }}
              onClick={handleLinkClick}
            >
              <svg className="fab-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <div className="fab-tooltip">View Source</div>
            </motion.a>

            <motion.a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="fab-item fab-vscode"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 1.05 }}
              onClick={handleLinkClick}
            >
              <svg className="fab-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
              </svg>
              {/* ✨ CAMBIADO: "Install Extension" → "Install Plugin" */}
              <div className="fab-tooltip">Install Plugin</div>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      <motion.button
        className={`fab-main ${fabOpen ? 'fab-open' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setFabOpen(!fabOpen);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={fabOpen ? "Close menu" : "Open menu"}
      >
        <motion.span 
          className="fab-icon"
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </motion.button>
    </motion.div>
  );
};

export default FAB;