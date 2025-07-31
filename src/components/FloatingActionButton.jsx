import React, { useState, useEffect } from 'react';
import { Github, ExternalLink, X } from 'lucide-react';
import { getTechnologyAsset } from '../utils/assets';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };

    // Show immediately on page load
    setIsVisible(true);

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ease-in-out ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
    }`}>
      {/* Action Buttons */}
      <div className={`mb-4 space-y-3 transition-all duration-700 ease-out ${
        isOpen 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      }`}>
        {/* GitHub Link */}
        <div className={`flex items-center space-x-3 transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
        }`} style={{transitionDelay: isOpen ? '0.1s' : '0s'}}>
          <a
            href="https://github.com/aMonteSl/CodeXR"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-lg border border-white/10"
          >
            <Github size={20} />
          </a>
          <span className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10 whitespace-nowrap">
            GitHub Repository
          </span>
        </div>

        {/* VS Code Marketplace Link */}
        <div className={`flex items-center space-x-3 transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
        }`} style={{transitionDelay: isOpen ? '0.2s' : '0s'}}>
          <a
            href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-lg"
          >
            <ExternalLink size={20} />
          </a>
          <span className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10 whitespace-nowrap">
            VS Code Marketplace
          </span>
        </div>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-500 ease-in-out hover:scale-110 shadow-xl ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-400 rotate-45 shadow-red-500/30' 
            : 'bg-gradient-to-r from-neon-blue to-purple-500 hover:from-neon-blue/80 hover:to-purple-500/80 shadow-neon-blue/30'
        }`}
        style={{
          boxShadow: isOpen 
            ? '0 8px 32px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            : '0 8px 32px rgba(0, 170, 255, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {isOpen ? (
          <X size={24} className="transition-transform duration-300" />
        ) : (
          <img 
            src={getTechnologyAsset("icon_white.svg")}
            alt="Code-XR" 
            className="w-8 h-8 transition-transform duration-300"
          />
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton;
