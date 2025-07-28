import React, { useEffect, useState } from 'react';
import { Play, Code, Monitor, Zap, Download, Star, GitFork, ChevronDown, BarChart3 } from 'lucide-react';
import useVSCodeMarketplaceData from '../hooks/useVSCodeMarketplaceData';
import AnimatedDescription from '../components/AnimatedDescription';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const marketplaceData = useVSCodeMarketplaceData();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const badges = [
    { icon: Zap, text: 'Real-time', color: 'from-yellow-400 to-orange-500' },
    { icon: GitFork, text: 'Open Source', color: 'from-purple-400 to-pink-500' },
    { icon: Monitor, text: 'VS Code', color: 'from-blue-400 to-cyan-500' },
    { icon: BarChart3, text: 'Code Metrics', color: 'from-indigo-400 to-purple-500' }
  ];

  const metrics = [
    { 
      value: marketplaceData.downloads, 
      label: 'Downloads (30d)', 
      sublabel: marketplaceData.activeInstalls !== '-' ? `${marketplaceData.activeInstalls} active` : 'Active installs',
      icon: Download 
    },
    { 
      value: marketplaceData.rating !== '-' ? `${marketplaceData.rating}★` : '-', 
      label: 'Rating', 
      sublabel: 'Based on reviews',
      icon: Star 
    },
    { 
      value: marketplaceData.version, 
      label: 'Version', 
      sublabel: 'Latest',
      icon: Code 
    }
  ];

  return (
    <section className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden pt-16">
      {/* Clean Background */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern only */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-blue/3 to-transparent">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 170, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 170, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo/Icon */}
        <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center animate-pulse-glow">
            <img 
              src="/icon_white.svg" 
              alt="Code-XR Logo" 
              className="w-24 h-24"
            />
          </div>
        </div>

        {/* Main Title */}
        <div className={`mb-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="text-white">Welcome to</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-white to-neon-blue bg-clip-text text-transparent">
              Code-XR
            </span>
          </h1>
          <AnimatedDescription />
        </div>

        {/* Interactive Badges */}
        <div className={`mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 px-3 py-2 glass-card-hover group cursor-pointer animate-scale-in"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className={`p-1.5 rounded-lg bg-gradient-to-r ${badge.color} group-hover:scale-110 transition-transform duration-300`}>
                  <badge.icon size={12} className="text-white" />
                </div>
                <span className="text-white font-medium text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className={`mb-8 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="glass-card-hover p-6 text-center group animate-scale-in"
                style={{animationDelay: `${800 + index * 100}ms`}}
              >
                <metric.icon size={24} className="mx-auto mb-3 text-neon-blue group-hover:scale-110 transition-transform duration-300" />
                <div className={`text-3xl font-bold mb-1 ${
                  metric.value === '-' ? 'text-gray-500' : 'text-white'
                }`}>
                  {metric.value}
                </div>
                <div className="text-lg font-medium text-neon-blue mb-1">{metric.label}</div>
                <div className="text-sm text-gray-400">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={`mb-8 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center space-x-2 justify-center group"
            >
              <Download size={20} className="group-hover:animate-bounce" />
              <span>Install Extension</span>
            </a>
            <a
              href="#quick-start-guide"
              className="btn-secondary flex items-center space-x-2 justify-center group"
            >
              <Play size={20} className="group-hover:scale-110 transition-transform" />
              <span>Quick Start Guide</span>
            </a>
          </div>
        </div>

        {/* Scroll Arrow */}
        <div className={`transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <a href="#features" className="block">
            <div className="flex flex-col items-center text-neon-blue hover:text-white transition-colors duration-300 animate-bounce">
              <ChevronDown size={32} className="animate-pulse" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
