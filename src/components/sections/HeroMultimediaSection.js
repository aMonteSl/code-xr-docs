import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const HeroMultimediaSection = ({ goToSlide }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Datos del carrusel
  const carouselImages = [
    {
      id: 1,
      src: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=XR+Code+Visualization',
      caption: 'Lore Ipsum dolor sit amet, consectetur adipiscing elit.',
      title: 'Lore Ipsum Visualization'
    },
    {
      id: 2,
      src: 'https://via.placeholder.com/600x400/06b6d4/ffffff?text=3D+Metrics+View',
      caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      title: 'Lorem Ipsum Metrics View'
    },
    {
      id: 3,
      src: 'https://via.placeholder.com/600x400/10b981/ffffff?text=AR+Code+Analysis',
      caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      title: 'Lorem Ipsum Analysis'
    }
  ];

  // Carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? carouselImages.length - 1 : prev - 1
    );
  };

  return (
    <div className="slide hero-multimedia-slide" id="multimedia">
      <div className="hero-multimedia-container">
        {/* ✨ NUEVO: Header centrado y mejorado */}
        <motion.div 
          className="hero-multimedia-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="multimedia-main-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Meet the <span className="brand">Future</span> of Coding
          </motion.h2>
          
          <motion.p 
            className="multimedia-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Experience what you're missing – <strong>code metrics in XR reality</strong>
          </motion.p>
          
          <motion.div 
            className="multimedia-highlight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span className="highlight-text">
              ✨ Don't just read about it – <em>feel the difference</em>
            </span>
          </motion.div>
        </motion.div>

        {/* ✨ Grid de contenido multimedia */}
        <motion.div 
          className="multimedia-content-grid"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Video Section */}
          <div className="video-section-hero">
            <motion.div 
              className="multimedia-section-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <span className="section-icon">📹</span>
              See It in Action
            </motion.div>
            
            <motion.div 
              className="video-wrapper-hero"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="video-placeholder">
                <div className="video-placeholder-content">
                  <motion.div 
                    className="play-button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>▶</span>
                  </motion.div>
                  <h4>XR Code Visualization Demo</h4>
                  <p>Watch how Code-XR transforms your development workflow</p>
                  <div className="video-badge">Coming Soon</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Carousel Section */}
          <div className="carousel-section-hero">
            <motion.div 
              className="multimedia-section-title"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <span className="section-icon">🖼️</span>
              Visual Gallery
            </motion.div>
            
            <motion.div 
              className="carousel-wrapper-hero"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <motion.button 
                className="carousel-nav prev"
                onClick={prevImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ‹
              </motion.button>
              
              <div className="carousel-content-hero">
                <motion.div 
                  key={currentImageIndex}
                  className="carousel-slide-hero"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="carousel-image-wrapper-hero">
                    <img 
                      src={carouselImages[currentImageIndex].src}
                      alt={carouselImages[currentImageIndex].title}
                      className="carousel-image"
                    />
                    <div className="image-overlay">
                      <h4>{carouselImages[currentImageIndex].title}</h4>
                    </div>
                  </div>
                  
                  <div className="carousel-caption-hero">
                    <p>{carouselImages[currentImageIndex].caption}</p>
                  </div>
                </motion.div>
              </div>
              
              <motion.button 
                className="carousel-nav next"
                onClick={nextImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ›
              </motion.button>
            </motion.div>
            
            {/* Indicadores del carrusel */}
            <div className="carousel-indicators">
              {carouselImages.map((_, index) => (
                <motion.button
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => goToImage(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Next Section Arrow */}
      <div 
        className="next-section-arrow" 
        onClick={() => goToSlide(2)}
      >
        <div className="arrow-icon">↓</div>
      </div>
    </div>
  );
};

export default HeroMultimediaSection;