import { useState, useEffect, useCallback } from 'react';

export const useRotatingText = (texts = [], options = {}) => {
  const {
    interval = 6000, // 6 segundos por defecto
    autoStart = true,
    loop = true
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);

  // Función para ir al siguiente texto
  const nextText = useCallback(() => {
    setCurrentIndex(prev => {
      if (loop) {
        return (prev + 1) % texts.length;
      } else {
        return Math.min(prev + 1, texts.length - 1);
      }
    });
  }, [texts.length, loop]);

  // Función para ir al texto anterior
  const prevText = useCallback(() => {
    setCurrentIndex(prev => {
      if (loop) {
        return prev === 0 ? texts.length - 1 : prev - 1;
      } else {
        return Math.max(prev - 1, 0);
      }
    });
  }, [texts.length, loop]);

  // Función para ir a un texto específico
  const goToText = useCallback((index) => {
    if (index >= 0 && index < texts.length) {
      setCurrentIndex(index);
    }
  }, [texts.length]);

  // Auto-rotate
  useEffect(() => {
    if (!isPlaying || texts.length <= 1) return;

    const intervalId = setInterval(() => {
      nextText();
    }, interval);

    return () => clearInterval(intervalId);
  }, [isPlaying, interval, nextText, texts.length]);

  // Pausar/reanudar
  const pause = useCallback(() => setIsPlaying(false), []);
  const play = useCallback(() => setIsPlaying(true), []);
  const toggle = useCallback(() => setIsPlaying(prev => !prev), []);

  // Reset
  const reset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(autoStart);
  }, [autoStart]);

  return {
    currentText: texts[currentIndex] || '',
    currentIndex,
    totalTexts: texts.length,
    isPlaying,
    nextText,
    prevText,
    goToText,
    pause,
    play,
    toggle,
    reset,
    isFirst: currentIndex === 0,
    isLast: currentIndex === texts.length - 1,
    progress: texts.length > 0 ? (currentIndex + 1) / texts.length : 0
  };
};