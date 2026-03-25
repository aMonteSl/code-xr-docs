import React from 'react';
import { Github, ExternalLink } from 'lucide-react';
import { getTechnologyAsset } from '../utils/assets';

const Footer = () => {
  return (
    <footer className="relative border-t border-white/10 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <img 
              src={getTechnologyAsset("icon_white.svg")}
              alt="Code-XR logo" 
              className="w-6 h-6"
            />
            <span className="text-white font-bold">Code-XR</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-neon-blue transition-colors flex items-center space-x-1"
            >
              <ExternalLink size={14} />
              <span>Marketplace</span>
            </a>
            <a
              href="https://github.com/aMonteSl/CodeXR"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-neon-blue transition-colors flex items-center space-x-1"
            >
              <Github size={14} />
              <span>GitHub</span>
            </a>
            <a
              href="https://github.com/aMonteSl/CodeXR/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-neon-blue transition-colors"
            >
              Bug Reports
            </a>
          </div>

          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Code-XR
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
