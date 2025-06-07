import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FeatureCard } from '../ui';

const FeaturesSection = ({ goToSlide }) => {
  const [leftCarouselIndex, setLeftCarouselIndex] = useState(0);
  const [rightCarouselIndex, setRightCarouselIndex] = useState(0);
  const [leftIsPlaying, setLeftIsPlaying] = useState(true);
  const [rightIsPlaying, setRightIsPlaying] = useState(true);

  // Core Features (lado izquierdo)
  const coreFeatures = [
    {
      icon: '🥽', // Mantiene XR/Desktop Experience
      title: 'Desktop/XR Experience',
      description: 'Full compatibility with Desktop/AR/VR devices for immersive code exploration.',
      color: '#45b7d1'
    },
    {
      icon: '📈', // Mejor para "Different Charts" - representa gráficos/charts
      title: 'Different Charts',
      description: 'Visualize your code with various chart types for better insights.',
      color: '#ff6b6b'
    },
    {
      icon: '⚡', // Mejor para "Real-time" - representa velocidad/instantáneo
      title: 'Real-time Metrics',
      description: 'Instantly visualize complexity, LOC, parameters, and other key code insights.',
      color: '#4ecdc4'
    }
  ];

  // Developer Experience Features (lado derecho) - EMOJIS ACTUALIZADOS
  const developerFeatures = [
    {
      icon: '🚀', // Mejor para "Easy to use" - plug and play, listo para usar
      title: 'Easy to Use',
      description: 'Install and start using Code-XR immediately. No setup required.',
      color: '#96ceb4'
    },
    {
      icon: '⚙️', // Perfecto para "Full Configuration" - configuración/ajustes
      title: 'Full Configuration',
      description: 'Adapt the plugin analysis speed, chart types, and more to your needs.',
      color: '#feca57'
    },
    {
      icon: '📊', // Mejor para "Multiple Analysis" - representa análisis de datos múltiples
      title: 'Multiple Analysis',
      description: 'Analyze multiple files or folders simultaneously for comprehensive insights.',
      color: '#ff9ff3'
    }
  ];

  // Auto-rotate carousels con control de pausa
  useEffect(() => {
    let leftInterval;
    let rightInterval;

    if (leftIsPlaying) {
      leftInterval = setInterval(() => {
        setLeftCarouselIndex(prev => (prev + 1) % coreFeatures.length);
      }, 4000);
    }

    if (rightIsPlaying) {
      rightInterval = setInterval(() => {
        setRightCarouselIndex(prev => (prev + 1) % developerFeatures.length);
      }, 5000);
    }

    return () => {
      if (leftInterval) clearInterval(leftInterval);
      if (rightInterval) clearInterval(rightInterval);
    };
  }, [leftIsPlaying, rightIsPlaying, coreFeatures.length, developerFeatures.length]);

  // Funciones de control del carrusel izquierdo
  const handleLeftIndicatorClick = (index) => {
    setLeftCarouselIndex(index);
    setLeftIsPlaying(false); // Pausar al interactuar
    setTimeout(() => setLeftIsPlaying(true), 8000); // Reanudar después de 8 segundos
  };

  const toggleLeftPlayback = () => {
    setLeftIsPlaying(!leftIsPlaying);
  };

  // Funciones de control del carrusel derecho
  const handleRightIndicatorClick = (index) => {
    setRightCarouselIndex(index);
    setRightIsPlaying(false); // Pausar al interactuar
    setTimeout(() => setRightIsPlaying(true), 8000); // Reanudar después de 8 segundos
  };

  const toggleRightPlayback = () => {
    setRightIsPlaying(!rightIsPlaying);
  };

  return (
    <div className="slide features-slide" id="features">
      {/* ✨ Header con FOMO - SIN highlight extra */}
      <motion.div
        className="features-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Stop <span className="brand">Coding Blind</span>
        </motion.h2>

        <motion.p
          className="features-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          While others struggle with flat code views, <strong>unlock the third dimension</strong> of development
        </motion.p>
      </motion.div>

      {/* ✨ Carrusel de dos secciones mejorado */}
      <motion.div
        className="features-carousel-container-clean"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {/* Lado Izquierdo - Core Features */}
        <motion.div
          className="carousel-section carousel-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="carousel-header-improved">
            <div className="carousel-title-section">
              <h3 className="carousel-title core-title">Core Features</h3>
            </div>

            <div className="carousel-controls">
              <div className="carousel-indicators-improved">
                {coreFeatures.map((_, index) => (
                  <div
                    key={index}
                    className={`indicator-improved ${index === leftCarouselIndex ? 'active' : ''}`}
                    onClick={() => handleLeftIndicatorClick(index)}
                    title={coreFeatures[index].title}
                  />
                ))}
              </div>

              <button
                className="playback-control"
                onClick={toggleLeftPlayback}
                title={leftIsPlaying ? 'Pausar' : 'Reproducir'}
              >
                {leftIsPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>

          <div className="carousel-content">
            <motion.div
              key={leftCarouselIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <FeatureCard
                icon={coreFeatures[leftCarouselIndex].icon}
                title={coreFeatures[leftCarouselIndex].title}
                description={coreFeatures[leftCarouselIndex].description}
                color={coreFeatures[leftCarouselIndex].color}
                className="carousel-feature-card"
                interactive={true}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Lado Derecho - Developer Experience */}
        <motion.div
          className="carousel-section carousel-right"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="carousel-header-improved">
            <div className="carousel-title-section">
              <h3 className="carousel-title developer-title">Developer Experience</h3>
            </div>

            <div className="carousel-controls">
              <div className="carousel-indicators-improved">
                {developerFeatures.map((_, index) => (
                  <div
                    key={index}
                    className={`indicator-improved ${index === rightCarouselIndex ? 'active' : ''}`}
                    onClick={() => handleRightIndicatorClick(index)}
                    title={developerFeatures[index].title}
                  />
                ))}
              </div>

              <button
                className="playback-control"
                onClick={toggleRightPlayback}
                title={rightIsPlaying ? 'Pausar' : 'Reproducir'}
              >
                {rightIsPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>

          <div className="carousel-content">
            <motion.div
              key={rightCarouselIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <FeatureCard
                icon={developerFeatures[rightCarouselIndex].icon}
                title={developerFeatures[rightCarouselIndex].title}
                description={developerFeatures[rightCarouselIndex].description}
                color={developerFeatures[rightCarouselIndex].color}
                className="carousel-feature-card"
                interactive={true}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Next Section Arrow */}
      <div
        className="next-section-arrow"
        onClick={() => goToSlide(3)}
      >
        <div className="arrow-icon">↓</div>
      </div>
    </div>
  );
};

export default FeaturesSection;