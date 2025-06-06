import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import './App.css';

// Importar hooks y utilidades
import { useExtensionStats } from './hooks/useExtensionStats';
import { formatNumber, formatRating, formatVersion } from './utils/formatNumbers';

// Import technology logos
import NodejsLogo from './assets/logos/nodejs.svg';
import TypescriptLogo from './assets/logos/typescript.svg';
import AframeLogo from './assets/logos/aframe.png';
import BabiaXRLogo from './assets/logos/babiaxr.png';
import PythonLogo from './assets/logos/python.svg';
import WebXRLogo from './assets/logos/webxr.png';

// Import Code-XR logos
import CodeXRIcon from './assets/logos/icon.svg';       
import CodeXRIconPNG from './assets/logos/icon.png';    

function App() {
  const containerRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const totalSlides = 6; // ✨ MANTENER 6 slides: Home, Features, How to Use, Benefits, Download, Technologies

  // Hook para obtener estadísticas reales
  const { downloads, installs, rating, ratingCount, version, loading, error } = useExtensionStats();

  // ✨ DEBUGGING: Log de versión en tiempo real
  useEffect(() => {
    console.log('🔍 APP.JS - Estado actual de versión:', {
      version: version,
      tipo: typeof version,
      loading: loading,
      error: error,
      formatteada: formatVersion(version)
    });
  }, [version, loading, error]);

  // Rotating phrases for subtitle
  const rotatingTexts = [
    "Visualize your code metrics in Augmented and Virtual Reality.",
    "Transform static code analysis into immersive XR exploration.",
    "Experience your code in XR or on-screen — clear, structured, insightful.",
    "Step beyond the editor — analyze code with spatial context in XR.",
    "From static views to immersive XR — see what your code is really doing.",
    "Code metrics reimagined — interactively, spatially, in XR."
  ];

  // Main scroll hook for the entire page
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Progress bar for scroll
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Effect to change text every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === rotatingTexts.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Detect current slide based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.slide');
      const scrollPosition = window.scrollY + window.innerHeight * 0.3;

      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setCurrentSlide(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to navigate to specific slide
  const goToSlide = (slideIndex) => {
    const slides = document.querySelectorAll('.slide');
    if (slides[slideIndex]) {
      slides[slideIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Function to copy command to clipboard
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('ext install aMonteSl.code-xr');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Close FAB when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabOpen && !event.target.closest('.fab-container')) {
        setFabOpen(false);
      }
    };

    if (fabOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [fabOpen]);

  return (
    <div className="App" ref={containerRef}>
      {/* Progress Bar */}
      <motion.div 
        className="progress-bar" 
        style={{ scaleX }}
      />

      {/* Header CON TECHNOLOGIES */}
      <motion.header className="header">
        <div className="nav-container">
          <motion.div 
            className="logo-container"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToSlide(0)}
          >
            <img src={CodeXRIcon} alt="Code-XR" className="logo-icon" />
            <span className="logo-text">Code-XR</span>
            {/* BADGE DE VERSIÓN */}
            {version && !loading && (
              <motion.span 
                className="version-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                title={`Versión actual: ${version}`}
              >
                {formatVersion(version)}
              </motion.span>
            )}
            {loading && (
              <motion.span 
                className="version-badge loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
              >
                ...
              </motion.span>
            )}
          </motion.div>
          
          <nav className="nav-menu">
            <button className="nav-link internal" onClick={() => goToSlide(0)}>
              Home
            </button>
            <button className="nav-link internal" onClick={() => goToSlide(1)}>
              Features
            </button>
            <button className="nav-link internal" onClick={() => goToSlide(2)}>
              How to Use
            </button>
            <button className="nav-link internal" onClick={() => goToSlide(3)}>
              Benefits
            </button>
            <button className="nav-link internal" onClick={() => goToSlide(4)}>
              Download
            </button>
            {/* ✨ AGREGAR: Technologies */}
            <button className="nav-link internal" onClick={() => goToSlide(5)}>
              Technologies
            </button>
            <div className="nav-separator"></div>
            <a 
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr" 
              className="nav-link external"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-text">Marketplace</span>
              <span className="external-icon">↗</span>
            </a>
            <a 
              href="https://github.com/aMonteSl/babiaxr-vscode" 
              className="nav-link external"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-text">GitHub</span>
              <span className="external-icon">↗</span>
            </a>
          </nav>
        </div>
      </motion.header>

      {/* Hero Slide - Slide 0 */}
      <motion.section 
        className="slide hero-slide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="hero-content"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.div className="hero-logo-container">
            <img src={CodeXRIcon} alt="Code-XR Logo" className="hero-logo" />
          </motion.div>

          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="brand">Code</span>-XR
          </motion.h1>

          <div className="hero-subtitle-container">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTextIndex}
                className="hero-subtitle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                {rotatingTexts[currentTextIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.div
            className="hero-badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <span className="badge">VS Code Extension</span>
            <span className="badge">Code Metrics</span>
            <span className="badge">Desktop/XR</span>
            <span className="badge">Open Source</span>
          </motion.div>

          {/* STATS DINÁMICAS - Con data-types para colores específicos */}
          {(loading || downloads !== null || installs !== null || rating !== null || version !== null) && (
            <motion.div
              className="hero-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.85 }}
            >
              <div className={`stats-container ${loading ? 'loading' : ''}`}>
                <motion.div 
                  className="stat-item"
                  data-type="downloads" // ✨ AGREGAR DATA-TYPE
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <div className={`stat-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatNumber(downloads)}
                  </div>
                  <div className="stat-label">Total Downloads</div>
                </motion.div>
                
                <div className="stats-separator"></div>
                
                <motion.div 
                  className="stat-item"
                  data-type="installs" // ✨ AGREGAR DATA-TYPE
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <div className={`stat-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatNumber(installs)}
                  </div>
                  <div className="stat-label">Active Installs</div>
                </motion.div>
                
                <div className="stats-separator"></div>
                
                <motion.div 
                  className="stat-item"
                  data-type="rating" // ✨ AGREGAR DATA-TYPE
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  <div className={`stat-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatRating(rating)}
                  </div>
                  <div className="stat-label">User Rating</div>
                </motion.div>
                
                <div className="stats-separator"></div>
                
                <motion.div 
                  className="stat-item"
                  data-type="version" // ✨ AGREGAR DATA-TYPE
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <div className={`stat-number version-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatVersion(version)}
                  </div>
                  <div className="stat-label">Version</div>
                </motion.div>
              </div>
              
              {error && (
                <div className="stats-error">
                  Unable to load current statistics
                </div>
              )}
            </motion.div>
          )}

          <motion.div 
            className="next-section-arrow"
            onClick={() => goToSlide(1)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <span className="arrow-icon">↓</span>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Slide - Slide 1 */}
      <motion.section 
        className="slide features-slide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h2 
          className="section-title"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="brand">Key</span> Features
        </motion.h2>
        
        <motion.div 
          className="features-grid"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <motion.div 
            className="feature-card"
            style={{ '--accent-color': '#ff6b6b' }} /* ✨ VERIFICAR QUE EXISTA */
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="feature-icon">🔍</div>
            <h3>Interactive Visualization</h3>
            <p>Explore your code in an immersive 3D environment where every metric comes alive with dynamic visualizations and intuitive navigation.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            style={{ '--accent-color': '#4ecdc4' }} /* ✨ VERIFICAR QUE EXISTA */
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="feature-icon">📊</div>
            <h3>Real-time Metrics</h3>
            <p>Instant analysis of complexity, code quality, and design patterns presented in a visual and comprehensible format.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            style={{ '--accent-color': '#45b7d1' }} /* ✨ VERIFICAR QUE EXISTA */
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="feature-icon">🥽</div>
            <h3>Complete XR Experience</h3>
            <p>Compatible with AR/VR devices for total immersion or on-screen visualization for maximum accessibility.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            style={{ '--accent-color': '#96ceb4' }} /* ✨ VERIFICAR QUE EXISTA */
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="feature-icon">⚡</div>
            <h3>Seamless Integration</h3>
            <p>Integrates directly into VS Code without additional configuration. Activate XR with a single click from your favorite editor.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            style={{ '--accent-color': '#feca57' }} /* ✨ VERIFICAR QUE EXISTA */
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="feature-icon">🎯</div>
            <h3>Smart Analysis</h3>
            <p>Advanced algorithms that identify patterns, suggest improvements, and highlight critical areas of your codebase.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            style={{ '--accent-color': '#ff9ff3' }} /* ✨ VERIFICAR QUE EXISTA */
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="feature-icon">🔄</div>
            <h3>Enhanced Collaboration</h3>
            <p>Share XR visualizations with your team for more effective code reviews and shared understanding.</p>
          </motion.div>
        </motion.div>

        <motion.div 
          className="next-section-arrow"
          onClick={() => goToSlide(2)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <span className="arrow-icon">↓</span>
        </motion.div>
      </motion.section>

      {/* How to Use Slide - Slide 2 */}
      <motion.section 
        className="slide howto-slide"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.5 }}
      >
        <motion.h2 
          className="section-title"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="brand">How</span> to Use Code-XR
        </motion.h2>
        
        <motion.div
          className="steps-container"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {[
            {
              step: "01",
              title: "XR Analysis",
              desc: "Right-click on a file and select 'CodeXR Analyze File: XR'",
              icon: "🖱️"
            },
            {
              step: "02", 
              title: "3D Visualization",
              desc: "A browser window opens with the 3D visualization of your code",
              icon: "🌐"
            },
            {
              step: "03",
              title: "Navigation Modes",
              desc: "AR: Real world • VR: Full immersion • 3D: Mouse controls",
              icon: "🎮"
            }
          ].map((step, index) => (
            <motion.div 
              key={index}
              className="step-item"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="step-number">{step.step}</div>
              <div className="step-content">
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="next-section-arrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          onClick={() => goToSlide(3)} // ✨ CORREGIDO: Va a slide 3
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Benefits Slide - Slide 3 */}
      <motion.section 
        className="slide benefits-slide"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.5 }}
      >
        <motion.h2 
          className="section-title"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="brand">Benefits</span> of Code-XR
        </motion.h2>
        
        <motion.div
          className="benefits-grid"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {[
            {
              title: "Spatial Understanding",
              desc: "Visualize code structure in 3D, easily identifying complex areas",
              icon: "🧭",
              stats: "300% faster"
            },
            {
              title: "Enhanced Collaboration", 
              desc: "Share XR visualizations for effective discussions about architecture",
              icon: "🤝",
              stats: "50% fewer bugs"
            },
            {
              title: "Smooth Workflow",
              desc: "Perfect integration with VS Code, without disrupting your development routine",
              icon: "⚡",
              stats: "100% compatible"
            }
          ].map((benefit, index) => (
            <motion.div 
              key={index}
              className="benefit-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px rgba(0,0,0,0.2)"
              }}
            >
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.desc}</p>
              <div className="benefit-stats">{benefit.stats}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="next-section-arrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          onClick={() => goToSlide(4)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Download Slide - Slide 4 */}
      <motion.section 
        className="slide download-slide"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="download-content"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">
            Ready to <span className="brand">Transform</span> Your Code?
          </h2>
          
          <p className="download-text">
            Join thousands of developers already using Code-XR to visualize their code metrics in immersive XR environments.
          </p>

          <div className="download-buttons">
            <a 
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr" 
              className="download-button primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install from Marketplace
            </a>
            
            <div 
              className="install-command"
              onClick={copyCommand}
            >
              <span className="command-label">Quick Install:</span>
              <span className="command-text">ext install aMonteSl.code-xr</span>
              <button className="copy-button">
                {copied ? '✓' : 'Copy'}
              </button>
              {copied && (
                <div className="copy-tooltip">
                  Copied!
                </div>
              )}
            </div>
          </div>

          {/* Solo mostrar stats si hay datos disponibles */}
          {(loading || downloads !== null || installs !== null || rating !== null || version !== null) && (
            <motion.div
              className="download-stats"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="download-stats-grid">
                <div className="download-stat" data-type="downloads"> {/* ✨ AGREGAR DATA-TYPE */}
                  <span className={`download-stat-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatNumber(downloads)}
                  </span>
                  <span className="download-stat-label">Downloads</span>
                </div>
                <div className="download-stat" data-type="installs"> {/* ✨ AGREGAR DATA-TYPE */}
                  <span className={`download-stat-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatNumber(installs)}
                  </span>
                  <span className="download-stat-label">Active Users</span>
                </div>
                <div className="download-stat" data-type="rating"> {/* ✨ AGREGAR DATA-TYPE */}
                  <span className={`download-stat-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatRating(rating)}
                  </span>
                  <span className="download-stat-label">Rating</span>
                </div>
                <div className="download-stat" data-type="version"> {/* ✨ AGREGAR DATA-TYPE */}
                  <span className={`download-stat-number version-number ${loading ? 'loading' : ''}`}>
                    {loading ? '...' : formatVersion(version)}
                  </span>
                  <span className="download-stat-label">Version</span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div 
            className="version-info"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <span>
              {/* ✨ MOSTRAR VERSIÓN DINÁMICA */}
              {loading ? 'Loading version...' : `Version ${formatVersion(version)} • Compatible with VS Code 1.60+`}
            </span>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Technologies Slide - Slide 5 ✨ ASEGURAR QUE EXISTE */}
      <motion.section 
        className="slide technologies-slide"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="section-title"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="brand">Technologies</span> Used
        </motion.h2>
        
        <motion.p
          className="technologies-subtitle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Code-XR is built with the most advanced technologies to deliver an exceptional XR experience
        </motion.p>

        <motion.div
          className="technologies-grid"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {[
            {
              name: "Node.js",
              description: "Runtime to execute JavaScript on the server",
              logo: NodejsLogo,
              color: "#339933",
              category: "Backend"
            },
            {
              name: "TypeScript",
              description: "Typed superset of JavaScript for greater robustness",
              logo: TypescriptLogo,
              color: "#3178C6",
              category: "Language"
            },
            {
              name: "A-Frame",
              description: "Web framework for building virtual reality experiences",
              logo: AframeLogo,
              color: "#EF2D5E",
              category: "VR Framework"
            },
            {
              name: "BabiaXR",
              description: "Library for data visualization in XR environments",
              logo: BabiaXRLogo,
              color: "#FF6B6B",
              category: "Data Viz"
            },
            {
              name: "Python",
              description: "Code metrics analysis and data processing",
              logo: PythonLogo,
              color: "#3776AB",
              category: "Analytics"
            },
            {
              name: "WebXR",
              description: "Standard API for extended reality experiences on the web",
              logo: WebXRLogo,
              color: "#00D2FF",
              category: "Web Standard"
            }
          ].map((tech, index) => (
            <motion.div 
              key={index}
              className="tech-card"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.6 + index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05,
                y: -8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
              }}
              viewport={{ once: true, amount: 0.3 }}
              style={{ '--tech-color': tech.color }}
            >
              <motion.div 
                className="tech-logo-container"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -2, 2, -2, 0]
                }}
                transition={{ duration: 0.5 }}
              >
                <img 
                  src={tech.logo} 
                  alt={`${tech.name} logo`} 
                  className="tech-logo"
                />
              </motion.div>
              
              <div className="tech-category">{tech.category}</div>
              <h3 className="tech-name">{tech.name}</h3>
              <p className="tech-description">{tech.description}</p>
              
              <motion.div 
                className="tech-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                viewport={{ once: true }}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="technologies-footer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          viewport={{ once: true }}
        >
          <p>Combining the best of modern web development with cutting-edge XR technologies</p>
        </motion.div>
      </motion.section>

      {/* Slide Navigation - ✨ ACTUALIZAR PARA 6 SLIDES */}
      <div className="slide-navigation">
        {Array.from({ length: totalSlides }, (_, index) => (
          <div
            key={index}
            className={`nav-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* Slide Counter - ✨ ACTUALIZAR PARA 6 SLIDES */}
      <div className="slide-counter">
        <span>{String(currentSlide + 1).padStart(2, '0')}</span>
        <span className="divider">/</span>
        <span>{String(totalSlides).padStart(2, '0')}</span>
      </div>

      {/* FAB - Floating Action Button */}
      <motion.div className="fab-container">
        {fabOpen && <div className="fab-overlay" onClick={() => setFabOpen(false)} />}
        
        <AnimatePresence>
          {fabOpen && (
            <>
              <motion.a
                href="https://github.com/aMonteSl/babiaxr-vscode"
                target="_blank"
                rel="noopener noreferrer"
                className="fab-item fab-github"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 1.05 }}
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
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 1.05 }}
              >
                <svg className="fab-svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                </svg>
                <div className="fab-tooltip">Install Extension</div>
              </motion.a>
            </>
          )}
        </AnimatePresence>

        <motion.button
          className={`fab-main ${fabOpen ? 'fab-open' : ''}`}
          onClick={() => setFabOpen(!fabOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
    </div>
  );
}

export default App;
