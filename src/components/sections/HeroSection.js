import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExtensionStats } from '../../hooks/useExtensionStats';
import { formatNumber, formatRating, formatVersion } from '../../utils/formatNumbers';
import { StatsContainer } from '../ui';
import CodeXRIcon from '../../assets/logos/icon.svg';

const HeroSection = ({ currentTextIndex, rotatingTexts, goToSlide }) => {
  const { downloads, installs, rating, version, loading, error } = useExtensionStats();

  // Datos de stats más inteligentes
  const statsData = [
    {
      value: downloads ? formatNumber(downloads) : formatNumber(installs),
      label: downloads ? 'Downloads' : 'Installs',
      sublabel: downloads && installs ? `${formatNumber(installs)} active` : null
    },
    {
      value: formatRating(rating),
      label: 'Rating',
      sublabel: rating ? `Based on reviews` : null
    },
    {
      value: formatVersion(version),
      label: 'Version',
      sublabel: version ? 'Latest' : null
    }
  ];

  return (
    <div className="slide hero-slide" id="hero">
      <div className="hero-content">
        <div className="hero-logo-container">
          <img 
            src={CodeXRIcon} 
            alt="Code-XR Logo" 
            className="hero-logo"
          />
        </div>

        <motion.h1 
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Welcome to <span className="brand">Code-XR</span>
        </motion.h1>

        {/* Sistema de rotación de texto */}
        <div className="hero-subtitle-container">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTextIndex}
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.8,
                ease: "easeInOut"
              }}
            >
              {rotatingTexts[currentTextIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ✨ BADGES CON SVGs PERSONALIZADOS */}
        <motion.div 
          className="hero-badges"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* Real-Time Badge */}
          <span className="badge badge-primary">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3c3.9 0 7 3.1 7 7 0 2.8-1.6 5.2-4 6.3V21h-2v-3H10v3H8v-4.7c-2.4-1.1-4-3.5-4-6.3 0-3.9 3.1-7 7-7h2zm-2 2c-2.8 0-5 2.2-5 5s2.2 5 5 5h2c2.8 0 5-2.2 5-5s-2.2-5-5-5h-2zm1 2v3l2.5 1.5-.8 1.3L11 11V7h1z"/>
            </svg>
            Real-Time
          </span>

          {/* Desktop/XR Badge */}
          <span className="badge badge-primary">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v10H4V6zm2 2v6h12V8H6zm8 9v2h4v1H6v-1h4v-2h4zm-2-7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 1c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z"/>
              <circle cx="18" cy="4" r="2" opacity="0.7"/>
              <circle cx="20" cy="6" r="1.5" opacity="0.5"/>
            </svg>
            Desktop/XR
          </span>

          {/* Metrics Badge */}
          <span className="badge badge-primary">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              <path d="M7 12h2v5H7zm4-6h2v11h-2zm4 3h2v8h-2z"/>
            </svg>
            Metrics
          </span>

          {/* ✨ ALTERNATIVA: Open Source más limpio */}
          <span className="badge badge-primary">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              {/* Círculo principal abierto por abajo */}
              <path d="M12 2C17.52 2 22 6.48 22 12c0 3.87-2.19 7.21-5.39 8.88l-1.22-1.63C17.64 18.14 19 15.21 19 12c0-3.87-3.13-7-7-7S5 8.13 5 12c0 3.21 1.36 6.14 3.61 7.25l-1.22 1.63C4.19 19.21 2 15.87 2 12c0-5.52 4.48-10 10-10z"/>
              {/* Apertura visible */}
              <rect x="9" y="20" width="6" height="2" rx="1"/>
              {/* Centro del símbolo */}
              <circle cx="12" cy="12" r="2"/>
            </svg>
            Open Source
          </span>

          {/* VS Code Badge */}
          <span className="badge badge-primary">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
            </svg>
            VS Code
          </span>
        </motion.div>

        {/* Stats con mejor manejo de estados */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <StatsContainer 
            stats={statsData}
            loading={loading}
            error={error ? 'Failed to load live stats from VS Code Marketplace' : null}
            layout="horizontal"
            className="hero-stats"
          />
        </motion.div>
      </div>

      <div 
        className="next-section-arrow" 
        onClick={() => goToSlide(1)}
      >
        <div className="arrow-icon">↓</div>
      </div>
    </div>
  );
};

export default HeroSection;