import React, { useState } from 'react';
import { motion } from 'framer-motion';

const DownloadButton = ({ 
  href,
  children,
  icon,
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  size = 'medium', // 'small' | 'medium' | 'large'
  external = true,
  onClick = null,
  className = '',
  disabled = false,
  loading = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const buttonVariants = {
    hover: {
      scale: disabled || loading ? 1 : 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: disabled || loading ? 1 : 0.95
    }
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
  };

  const ButtonComponent = href ? motion.a : motion.button;
  
  const buttonProps = href ? {
    href: disabled ? undefined : href,
    target: external ? "_blank" : undefined,
    rel: external ? "noopener noreferrer" : undefined
  } : {
    type: "button"
  };

  return (
    <ButtonComponent
      className={`download-button ${variant} ${size} ${isPressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''} ${className}`}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      disabled={disabled}
      {...buttonProps}
    >
      {loading && (
        <div className="button-spinner">
          <div className="spinner" />
        </div>
      )}
      
      {icon && !loading && (
        <span className="button-icon">
          {typeof icon === 'string' ? icon : icon}
        </span>
      )}
      
      <span className="button-text">
        {children}
      </span>
      
      {external && href && !loading && (
        <span className="external-indicator">↗</span>
      )}
      
      {/* Ripple effect */}
      <div className="button-ripple" />
    </ButtonComponent>
  );
};

export default DownloadButton;