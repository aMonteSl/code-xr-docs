import { useState, useEffect, useCallback } from 'react';

export const useSlideNavigation = (totalSlides = 7) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Detectar slide actual basado en scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const newSlide = Math.round(scrollTop / windowHeight);
      setCurrentSlide(Math.min(newSlide, totalSlides - 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSlides]);

  // Función para navegar a slide específico
  const goToSlide = useCallback((slideIndex) => {
    if (slideIndex < 0 || slideIndex >= totalSlides) return;
    
    const targetScroll = slideIndex * window.innerHeight;
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, [totalSlides]);

  // Navegar al siguiente slide
  const nextSlide = useCallback(() => {
    const next = Math.min(currentSlide + 1, totalSlides - 1);
    goToSlide(next);
  }, [currentSlide, totalSlides, goToSlide]);

  // Navegar al slide anterior
  const prevSlide = useCallback(() => {
    const prev = Math.max(currentSlide - 1, 0);
    goToSlide(prev);
  }, [currentSlide, goToSlide]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ': // Spacebar
          event.preventDefault();
          nextSlide();
          break;
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          prevSlide();
          break;
        case 'Home':
          event.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          goToSlide(totalSlides - 1);
          break;
        default:
          // Números 1-9 para ir a slides específicos
          if (event.key >= '1' && event.key <= '9') {
            const slideNumber = parseInt(event.key, 10) - 1;
            if (slideNumber < totalSlides) {
              event.preventDefault();
              goToSlide(slideNumber);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, totalSlides]);

  return {
    currentSlide,
    totalSlides,
    goToSlide,
    nextSlide,
    prevSlide,
    isFirstSlide: currentSlide === 0,
    isLastSlide: currentSlide === totalSlides - 1,
    progress: (currentSlide + 1) / totalSlides
  };
};