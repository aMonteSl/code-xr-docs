import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatVersion } from '../utils/formatNumbers';

// Assets
import CodeXRIconPNG from '../assets/logos/icon.png';

// Hooks personalizados
import { 
  useExtensionStats, 
  useScrollProgress, 
  useSlideNavigation, 
  useRotatingText 
} from '../hooks';

// Componentes UI y secciones
import { 
  FAB, 
  ProgressBar, 
  SlideNavigation,
  MobileMenu, // ✨ NUEVO
  HeroSection,
  HeroMultimediaSection,
  FeaturesSection,
  HowToUseSection,
  BenefitsSection,
  TechnologiesSection,
  DownloadSection
} from '../components';

function Home() {
  const navigate = useNavigate();
  
  // ✨ NUEVO: Estado para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✨ HOOKS PERSONALIZADOS
  const { version } = useExtensionStats();
  const { containerRef, scaleX } = useScrollProgress();
  const { currentSlide, totalSlides, goToSlide } = useSlideNavigation(7);
  
  const rotatingTexts = [
    "Visualize your code metrics in Augmented and Virtual Reality.",
    "Transform static code analysis into immersive XR exploration.", 
    "Experience your code in XR or on-screen — clear, structured, insightful.",
    "Step beyond the editor — analyze code with spatial context in XR.",
    "From static views to immersive XR — see what your code is really doing.",
    "Code metrics reimagined — interactively, spatially, in XR."
  ];

  const { currentText, currentIndex } = useRotatingText(rotatingTexts, {
    interval: 4000,
    autoStart: true,
    loop: true
  });

  // ✨ NUEVO: Manejar menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="App">
      <ProgressBar progress={scaleX} />
      
      <div ref={containerRef} className="scroll-container">
        <header className="header">
          <nav className="nav-container">
            <div className="logo-container" onClick={() => goToSlide(0)}>
              <img src={CodeXRIconPNG} alt="Code-XR" className="logo-icon" />
              <span className="logo-text">Code-XR</span>
              <span className="version-badge">{formatVersion(version)}</span>
            </div>
            
            {/* ✨ MENÚ DESKTOP - Solo visible en pantallas grandes */}
            <div className="nav-menu-center">
              {[
                { text: 'Welcome', index: 0 },
                { text: 'Multimedia', index: 1 },
                { text: 'Features', index: 2 },
                { text: 'How to Use', index: 3 },
                { text: 'Benefits', index: 4 },
                { text: 'Technologies', index: 5 },
                { text: 'Download', index: 6 }
              ].map((item, arrayIndex) => (
                <React.Fragment key={item.text}>
                  <button 
                    className="nav-link internal" 
                    onClick={() => goToSlide(item.index)}
                  >
                    <span className="nav-text">{item.text}</span>
                  </button>
                  {arrayIndex < 6 && <div className="nav-separator" />}
                </React.Fragment>
              ))}
            </div>
              
            <div className="nav-menu-right">
              {[
                { text: 'Marketplace', url: 'https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr', type: 'marketplace' },
                { text: 'GitHub', url: 'https://github.com/aMonteSl/babiaxr-vscode', type: 'github' }
              ].map((link, index) => (
                <React.Fragment key={link.text}>
                  {index > 0 && <div className="nav-separator" />}
                  <a 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`nav-link external nav-${link.type}`}
                  >
                    <span className="nav-text">{link.text}</span>
                    <span className="external-icon">↗</span>
                  </a>
                </React.Fragment>
              ))}
            </div>

            {/* ✨ NUEVO: Botón hamburguesa para móviles */}
            <button 
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="hamburger-icon">
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
              </div>
            </button>
          </nav>
        </header>

        {/* ✨ NUEVO: Menú móvil */}
        <MobileMenu 
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          currentSlide={currentSlide}
          onSlideChange={goToSlide}
        />

        <SlideNavigation 
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onSlideChange={goToSlide}
          showCounter={true}
        />

        <HeroSection 
          currentTextIndex={currentIndex}
          rotatingTexts={rotatingTexts}
          goToSlide={goToSlide}
        />
        <HeroMultimediaSection goToSlide={goToSlide} />
        <FeaturesSection goToSlide={goToSlide} />
        <HowToUseSection goToSlide={goToSlide} />
        <BenefitsSection goToSlide={goToSlide} />
        <TechnologiesSection goToSlide={goToSlide} />
        <DownloadSection />

        <FAB />
      </div>
    </div>
  );
}

export default Home;
