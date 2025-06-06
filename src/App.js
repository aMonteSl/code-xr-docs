import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import './App.css';

// Importar logos de tecnologías
import NodejsLogo from './assets/logos/nodejs.svg';
import TypescriptLogo from './assets/logos/typescript.svg';
import AframeLogo from './assets/logos/aframe.png';
import BabiaXRLogo from './assets/logos/babiaxr.png';
import PythonLogo from './assets/logos/python.svg';
import WebXRLogo from './assets/logos/webxr.png';

// Importar logos de Code-XR
import CodeXRIcon from './assets/logos/icon.svg';       // Para el hero (fondo transparente)
import CodeXRIconPNG from './assets/logos/icon.png';    // Para el navbar (fondo blanco)

function App() {
  const containerRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [fabOpen, setFabOpen] = useState(false); // Estado para el FAB
  const totalSlides = 6;

  // Frases rotativas para el subtítulo
  const rotatingTexts = [
    "Visualize your code metrics in Augmented and Virtual Reality.",
    "Transform static code analysis into immersive XR exploration.",
    "Experience your code in XR or on-screen — clear, structured, insightful.",
    "Step beyond the editor — analyze code with spatial context in XR.",
    "From static views to immersive XR — see what your code is really doing.",
    "Code metrics reimagined — interactively, spatially, in XR."
  ];

  // Hook principal de scroll para toda la página
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Progress bar del scroll
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Efecto para cambiar el texto cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === rotatingTexts.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000); // Cambia cada 4 segundos

    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Detectar el slide actual basado en el scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.slide');
      const scrollPosition = window.scrollY + window.innerHeight * 0.3; // Cambio: usar 30% en lugar de 50%

      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setCurrentSlide(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para navegar a un slide específico
  const goToSlide = (slideIndex) => {
    const slides = document.querySelectorAll('.slide');
    if (slides[slideIndex]) {
      slides[slideIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Función para copiar el comando al portapapeles
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('ext install aMonteSl.code-xr');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset después de 2 segundos
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = 'ext install aMonteSl.code-xr';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Cerrar FAB al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabOpen && !event.target.closest('.fab-container')) {
        setFabOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fabOpen]);

  return (
    <div className="App" ref={containerRef}>
      {/* Progress Bar */}
      <motion.div 
        className="progress-bar"
        style={{ scaleX }}
      />

      {/* FAB - Floating Action Button */}
      {fabOpen && <div className="fab-overlay" onClick={() => setFabOpen(false)} />}
      
      <div className="fab-container">
        <motion.button
          className={`fab-main ${fabOpen ? 'fab-open' : ''}`}
          onClick={() => setFabOpen(!fabOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="fab-icon">+</span>
        </motion.button>

        <AnimatePresence>
          {fabOpen && (
            <>
              <motion.a
                href="https://github.com/aMonteSl/CodeXR"
                target="_blank"
                rel="noopener noreferrer"
                className="fab-item fab-github"
                initial={{ scale: 0, y: 0, opacity: 0 }}
                animate={{ scale: 1, y: -70, opacity: 1 }}
                exit={{ scale: 0, y: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.1,
                  ease: [0.4, 0, 0.2, 1],
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg viewBox="0 0 24 24" className="fab-svg">
                  <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="fab-tooltip">GitHub</span>
              </motion.a>

              <motion.a
                href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
                target="_blank"
                rel="noopener noreferrer"
                className="fab-item fab-vscode"
                initial={{ scale: 0, y: 0, opacity: 0 }}
                animate={{ scale: 1, y: -140, opacity: 1 }}
                exit={{ scale: 0, y: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg viewBox="0 0 24 24" className="fab-svg">
                  <path fill="currentColor" d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                </svg>
                <span className="fab-tooltip">VS Code</span>
              </motion.a>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Slide Navigation */}
      <div className="slide-navigation">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <motion.button
            key={index}
            className={`nav-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="slide-counter">
        <span>{String(currentSlide + 1).padStart(2, '0')}</span>
        <span className="divider">/</span>
        <span>{String(totalSlides).padStart(2, '0')}</span>
      </div>

      {/* Header - ACTUALIZADO CON ENLACES EXTERNOS */}
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="nav-container">
          <motion.div 
            className="logo-container"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToSlide(0)}
          >
            <img src={CodeXRIconPNG} alt="Code-XR" className="logo-icon" />
            <span className="logo-text">Code-XR</span>
          </motion.div>
          <nav className="nav-menu">
            {/* Enlaces de navegación interna */}
            <motion.button 
              onClick={() => goToSlide(0)}
              className="nav-link internal"
              whileHover={{ scale: 1.1, color: "#4ecdc4" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Inicio
            </motion.button>
            <motion.button 
              onClick={() => goToSlide(1)}
              className="nav-link internal"
              whileHover={{ scale: 1.1, color: "#4ecdc4" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Características
            </motion.button>
            <motion.button 
              onClick={() => goToSlide(2)}
              className="nav-link internal"
              whileHover={{ scale: 1.1, color: "#4ecdc4" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Cómo Usar
            </motion.button>
            <motion.button 
              onClick={() => goToSlide(3)}
              className="nav-link internal"
              whileHover={{ scale: 1.1, color: "#4ecdc4" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Beneficios
            </motion.button>
            <motion.button 
              onClick={() => goToSlide(4)}
              className="nav-link internal"
              whileHover={{ scale: 1.1, color: "#4ecdc4" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Descargar
            </motion.button>
            <motion.button 
              onClick={() => goToSlide(5)}
              className="nav-link internal"
              whileHover={{ scale: 1.1, color: "#4ecdc4" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Tecnologías
            </motion.button>

            {/* Separador visual */}
            <div className="nav-separator"></div>

            {/* Enlaces externos */}
            <motion.a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link external"
              whileHover={{ 
                scale: 1.1, 
                color: "#ff6b6b",
                textShadow: "0 0 8px rgba(255, 107, 107, 0.4)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="nav-text">Marketplace</span>
              <span className="external-icon">↗</span>
            </motion.a>
            
            <motion.a
              href="https://github.com/aMonteSl/CodeXR"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link external"
              whileHover={{ 
                scale: 1.1, 
                color: "#feca57",
                textShadow: "0 0 8px rgba(254, 202, 87, 0.4)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="nav-text">GitHub</span>
              <span className="external-icon">↗</span>
            </motion.a>
          </nav>
        </div>
      </motion.header>

      {/* Hero Slide - MANTIENE SVG TRANSPARENTE */}
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
          <motion.div 
            className="hero-logo-container"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <img src={CodeXRIcon} alt="Code-XR Logo" className="hero-logo" />
          </motion.div>

          <motion.h1 
            className="hero-title"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="brand">Code-XR</span> for VS Code
          </motion.h1>
          
          {/* Subtítulo animado con texto rotativo */}
          <div className="hero-subtitle-container">
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentTextIndex}
                className="hero-subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeInOut"
                }}
              >
                {rotatingTexts[currentTextIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          <motion.div
            className="install-command"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            onClick={copyCommand}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="command-label">Quick Install:</span>
            <code className="command-text">ext install aMonteSl.code-xr</code>
            <motion.button 
              className="copy-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={copied ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {copied ? '✓' : '📋'}
            </motion.button>
            
            {/* Tooltip de confirmación */}
            <AnimatePresence>
              {copied && (
                <motion.div
                  className="copy-tooltip"
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div
            className="hero-badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span className="badge">🥽 VR/AR</span>
            <span className="badge">📊 Metrics</span>
            <span className="badge">⚡ Real-time</span>
          </motion.div>
          
          <motion.button 
            className="cta-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
              background: "linear-gradient(45deg, #ff8a8a, #5ed9d1)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToSlide(1)}
          >
            Explore Features
          </motion.button>
        </motion.div>

        {/* Next Section Arrow */}
        <motion.div 
          className="next-section-arrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          onClick={() => goToSlide(1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="arrow-text">Key Features</span>
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Slide 2: Features Section */}
      <motion.section 
        className="slide features-slide"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2 
          className="section-title"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          🧠 Características Principales
        </motion.h2>
        
        <div className="features-grid">
          {[
            { 
              title: "Visualización XR Inmersiva", 
              desc: "Explora métricas como líneas de código, parámetros de funciones y complejidad en entornos 3D interactivos", 
              icon: "🥽",
              color: "#ff6b6b"
            },
            { 
              title: "Actualizaciones en Tiempo Real", 
              desc: "Los cambios en el código se reflejan instantáneamente en las visualizaciones, sin recargar", 
              icon: "⚡",
              color: "#4ecdc4"
            },
            { 
              title: "Mapeo Multidimensional", 
              desc: "Representa métricas mediante altura, profundidad, área y color personalizable", 
              icon: "📊",
              color: "#45b7d1"
            },
            { 
              title: "Integración BabiaXR + A-Frame", 
              desc: "Utiliza tecnologías avanzadas para renderizar gráficos 3D y experiencias XR fluidas", 
              icon: "🔧",
              color: "#96ceb4"
            },
            { 
              title: "Compatibilidad Multiplataforma", 
              desc: "Funciona con Oculus, Valve Index, HTC Vive y dispositivos AR/navegadores", 
              icon: "🌐",
              color: "#feca57"
            },
            { 
              title: "Integración VS Code", 
              desc: "Se adapta perfectamente a tu flujo de trabajo habitual en Visual Studio Code", 
              icon: "💻",
              color: "#ff9ff3"
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 50, rotateY: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
              }}
              viewport={{ once: true, amount: 0.3 }}
              style={{ '--accent-color': feature.color }}
            >
              <motion.div 
                className="feature-icon"
                whileHover={{ 
                  scale: 1.2,
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{ duration: 0.5 }}
              >
                {feature.icon}
              </motion.div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Next Section Arrow */}
        <motion.div 
          className="next-section-arrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          onClick={() => goToSlide(2)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="arrow-text">How to Use</span>
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Slide 3: How to Use Section */}
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
          🚀 Cómo Utilizar Code-XR
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
              title: "Análisis XR",
              desc: "Haz clic derecho en un archivo y selecciona 'CodeXR Analyze File: XR'",
              icon: "🖱️"
            },
            {
              step: "02", 
              title: "Visualización 3D",
              desc: "Se abre una ventana del navegador con la visualización 3D de tu código",
              icon: "🌐"
            },
            {
              step: "03",
              title: "Modos de Navegación",
              desc: "AR: Mundo real • VR: Inmersión completa • 3D: Controles de mouse",
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

        {/* Next Section Arrow */}
        <motion.div 
          className="next-section-arrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          onClick={() => goToSlide(3)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="arrow-text">Benefits</span>
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Slide 4: Benefits Section */}
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
          🎯 Beneficios de Code-XR
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
              title: "Comprensión Espacial",
              desc: "Visualiza la estructura del código en 3D, identificando áreas complejas fácilmente",
              icon: "🧭",
              stats: "300% más rápido"
            },
            {
              title: "Colaboración Mejorada", 
              desc: "Comparte visualizaciones XR para discusiones efectivas sobre arquitectura",
              icon: "🤝",
              stats: "50% menos bugs"
            },
            {
              title: "Flujo de Trabajo Fluido",
              desc: "Integración perfecta con VS Code, sin interrumpir tu rutina de desarrollo",
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

        {/* Next Section Arrow */}
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
          <span className="arrow-text">Download</span>
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Slide 5: Download Section - Añadir flecha */}
      <motion.section 
        className="slide download-slide"
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
          ¡Comienza Ahora!
        </motion.h2>
        
        <motion.div
          className="download-content"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <p className="download-text">
            Descarga Code-XR desde el VS Code Marketplace y transforma tu experiencia de desarrollo
          </p>
          
          <motion.div 
            className="download-buttons"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.a 
              href="https://marketplace.visualstudio.com/items?itemName=CodeXR"
              target="_blank"
              rel="noopener noreferrer"
              className="download-button primary"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0px 15px 35px rgba(0,0,0,0.3)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              📦 Descargar de VS Code Marketplace
            </motion.a>
            
            <motion.a 
              href="https://github.com/CodeXR-VSCode"
              target="_blank"
              rel="noopener noreferrer"
              className="download-button secondary"
              whileHover={{ 
                scale: 1.05,
                background: "rgba(255,255,255,0.2)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              💻 Ver en GitHub
            </motion.a>
          </motion.div>

          <motion.div 
            className="version-info"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <span>Versión 2.0.0 • Compatible con VS Code 1.60+</span>
          </motion.div>
        </motion.div>

        {/* Next Section Arrow - Añadido */}
        <motion.div 
          className="next-section-arrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          onClick={() => goToSlide(5)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="arrow-text">Technologies</span>
          <motion.div 
            className="arrow-icon"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Slide 6: Technologies Section - ACTUALIZADA CON LOGOS */}
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
          🛠️ Tecnologías Utilizadas
        </motion.h2>
        
        <motion.p
          className="technologies-subtitle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Code-XR está construido con las tecnologías más avanzadas para ofrecer una experiencia XR excepcional
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
              description: "Runtime para ejecutar JavaScript en el servidor",
              logo: NodejsLogo,
              color: "#339933",
              category: "Backend"
            },
            {
              name: "TypeScript",
              description: "Superset tipado de JavaScript para mayor robustez",
              logo: TypescriptLogo,
              color: "#3178C6",
              category: "Language"
            },
            {
              name: "A-Frame",
              description: "Framework web para construir experiencias de realidad virtual",
              logo: AframeLogo,
              color: "#EF2D5E",
              category: "VR Framework"
            },
            {
              name: "BabiaXR",
              description: "Biblioteca para visualización de datos en entornos XR",
              logo: BabiaXRLogo,
              color: "#FF6B6B",
              category: "Data Viz"
            },
            {
              name: "Python",
              description: "Análisis de métricas de código y procesamiento de datos",
              logo: PythonLogo,
              color: "#3776AB",
              category: "Analytics"
            },
            {
              name: "WebXR",
              description: "API estándar para experiencias de realidad extendida en web",
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
          <p>Combinando lo mejor del desarrollo web moderno con tecnologías XR de vanguardia</p>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default App;
