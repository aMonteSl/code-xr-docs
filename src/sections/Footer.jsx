import React from 'react';
import { Github, ExternalLink, Heart, Coffee, Mail } from 'lucide-react';
import useVSCodeMarketplaceData from '../hooks/useVSCodeMarketplaceData';

const Footer = () => {
  const marketplaceData = useVSCodeMarketplaceData();
  
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Gallery', href: '#gallery' },
      { name: 'Installation', href: '#install' },
      { name: 'Quick Start', href: '#quick-start-guide' },
      { name: 'Technologies', href: '#technologies' }
    ],
    community: [
      { name: 'GitHub', href: 'https://github.com/aMonteSl/CodeXR' },
      { name: 'Discord', href: '#' },
      { name: 'Twitter', href: '#' },
      { name: 'Reddit', href: '#' }
    ],
    support: [
      { name: 'Bug Reports', href: 'https://github.com/aMonteSl/CodeXR/issues' },
      { name: 'Feature Requests', href: 'https://github.com/aMonteSl/CodeXR/discussions' },
      { name: 'Changelog', href: 'https://github.com/aMonteSl/CodeXR/releases' },
      { name: 'Roadmap', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'License', href: 'https://github.com/aMonteSl/CodeXR/blob/main/LICENSE' },
      { name: 'Security', href: '#' }
    ]
  };

  return (
    <footer className="bg-black border-t border-white/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img 
                    src="/icon_white.svg" 
                    alt="Code-XR" 
                    className="w-8 h-8"
                  />
                </div>
                <div>
                  <span className="text-white font-bold text-xl">Code-XR</span>
                  <div className="text-gray-400 text-sm">{marketplaceData.version}</div>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Transform your VS Code into an immersive XR development environment. 
                Code in virtual reality, visualize data in 3D, and collaborate in mixed reality.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    marketplaceData.downloads === '-' ? 'text-gray-500' : 'text-neon-blue'
                  }`}>
                    {marketplaceData.downloads}
                  </div>
                  <div className="text-gray-400 text-sm">Downloads (30d)</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    marketplaceData.rating === '-' ? 'text-gray-500' : 'text-neon-blue'
                  }`}>
                    {marketplaceData.rating !== '-' ? `${marketplaceData.rating}★` : '-'}
                  </div>
                  <div className="text-gray-400 text-sm">Rating</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    marketplaceData.activeInstalls === '-' ? 'text-gray-500' : 'text-neon-blue'
                  }`}>
                    {marketplaceData.activeInstalls}
                  </div>
                  <div className="text-gray-400 text-sm">Active</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-4">
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center space-x-2"
                >
                  <ExternalLink size={16} />
                  <span>Install Now</span>
                </a>
                <a
                  href="https://github.com/aMonteSl/CodeXR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Product */}
              <div>
                <h3 className="text-white font-bold mb-4">Product</h3>
                <ul className="space-y-2">
                  {footerLinks.product.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-neon-blue transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Community */}
              <div>
                <h3 className="text-white font-bold mb-4">Community</h3>
                <ul className="space-y-2">
                  {footerLinks.community.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-neon-blue transition-colors duration-200 text-sm flex items-center space-x-1"
                      >
                        <span>{link.name}</span>
                        {link.href.startsWith('http') && <ExternalLink size={12} />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-white font-bold mb-4">Support</h3>
                <ul className="space-y-2">
                  {footerLinks.support.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-neon-blue transition-colors duration-200 text-sm flex items-center space-x-1"
                      >
                        <span>{link.name}</span>
                        {link.href.startsWith('http') && <ExternalLink size={12} />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-white font-bold mb-4">Legal</h3>
                <ul className="space-y-2">
                  {footerLinks.legal.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-neon-blue transition-colors duration-200 text-sm flex items-center space-x-1"
                      >
                        <span>{link.name}</span>
                        {link.href.startsWith('http') && <ExternalLink size={12} />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-white/10">
          <div className="glass-card p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get notified about new features, updates, and XR development tips
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue transition-colors"
              />
              <button className="btn-primary flex items-center justify-center space-x-2">
                <Mail size={16} />
                <span>Subscribe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Code-XR. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Made with</span>
                <Heart size={16} className="text-red-400 animate-pulse" />
                <span>for developers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Coffee size={16} className="text-neon-blue" />
                <span>Buy me a coffee</span>
              </div>
            </div>

            <div className="text-gray-400 text-sm">
              Powered by VS Code Extensions API
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
