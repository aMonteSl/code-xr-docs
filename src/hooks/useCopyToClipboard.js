import { useState, useCallback } from 'react';

export const useCopyToClipboard = (options = {}) => {
  const {
    successDuration = 2000, // Duración del estado "copiado"
    onSuccess = null,
    onError = null
  } = options;

  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  const copyToClipboard = useCallback(async (text) => {
    if (!text) {
      const errorMsg = 'No text provided to copy';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return false;
    }

    try {
      // Método moderno usando navigator.clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Fallback copy failed');
        }
      }

      // Estado de éxito
      setIsCopied(true);
      setError(null);
      
      if (onSuccess) onSuccess(text);

      // Resetear después del tiempo especificado
      setTimeout(() => {
        setIsCopied(false);
      }, successDuration);

      return true;

    } catch (err) {
      const errorMsg = `Failed to copy: ${err.message}`;
      setError(errorMsg);
      setIsCopied(false);
      
      if (onError) onError(errorMsg);
      
      console.error('Copy to clipboard failed:', err);
      return false;
    }
  }, [successDuration, onSuccess, onError]);

  // Función para resetear estados manualmente
  const reset = useCallback(() => {
    setIsCopied(false);
    setError(null);
  }, []);

  // Función para copiar texto de un elemento DOM
  const copyElementText = useCallback(async (element) => {
    if (!element) return false;
    
    const text = element.textContent || element.innerText || '';
    return await copyToClipboard(text);
  }, [copyToClipboard]);

  return {
    isCopied,
    error,
    copyToClipboard,
    copyElementText,
    reset,
    isSupported: !!(navigator.clipboard || document.execCommand)
  };
};