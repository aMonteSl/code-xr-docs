import React, { useState, useEffect } from 'react';
import { Github, Download, Star, ExternalLink, Menu, X } from 'lucide-react';
import useVSCodeMarketplaceData from '../hooks/useVSCodeMarketplaceData';
import { getTechnologyAsset } from '../utils/assets';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const marketplaceData = useVSCodeMarketplaceData();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#install', label: 'Install' },
    { href: '#quick-start-guide', label: 'Quick Start' },
    { href: '#technologies', label: 'Technologies' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img 
                src={getTechnologyAsset("icon_white.svg")}
                alt="Code-XR" 
                className="w-6 h-6"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg">Code-XR</span>
              <span className="text-gray-400 text-xs">{marketplaceData.version}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-neon-blue transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* External Links */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://github.com/aMonteSl/CodeXR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-all duration-300 rounded-lg"
            >
              <Github size={16} />
              <span className="font-medium">GitHub</span>
            </a>
            <a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-neon-blue text-black hover:bg-neon-blue-dark transition-all duration-300 rounded-lg font-medium glow-blue"
            >
              <ExternalLink size={16} />
              <span>Marketplace</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-neon-blue transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10 animate-fade-in-up">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-gray-300 hover:text-neon-blue transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <a
                  href="https://github.com/aMonteSl/CodeXR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 border border-neon-blue text-neon-blue rounded-lg"
                >
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-neon-blue text-black rounded-lg"
                >
                  <ExternalLink size={16} />
                  <span>Marketplace</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
