import React, { useEffect, useMemo, useState } from 'react';
import { Play, Code, Monitor, Zap, Download, Star, ChevronDown, BarChart3 } from 'lucide-react';
import useVSCodeMarketplaceData from '../hooks/useVSCodeMarketplaceData';
import AnimatedDescription from '../components/AnimatedDescription';
import MetricPanel from '../components/MetricPanel';
import { getTechnologyAsset } from '../utils/assets';
import { latestRelease } from '../content/releaseContent';

const formatPublishedDate = (value) => {
  if (!value || value === '-') {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const marketplaceData = useVSCodeMarketplaceData();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const badges = [
    { icon: Zap, text: 'Unified analysis engine', color: 'from-yellow-400 to-orange-500' },
    { icon: Monitor, text: 'Shared virtual screens', color: 'from-blue-400 to-cyan-500' },
    { icon: BarChart3, text: 'Expanded XR metrics', color: 'from-indigo-400 to-purple-500' },
    { icon: Code, text: 'Collaborative XR rooms', color: 'from-purple-400 to-pink-500' }
  ];

  const metrics = useMemo(() => {
    const items = [
      {
        id: 'active-installs',
        value: marketplaceData.activeInstalls,
        label: marketplaceData.sourceLabels.activeInstalls,
        sublabel: 'Official marketplace API',
        icon: Download,
      },
      {
        id: 'marketplace-downloads',
        value: marketplaceData.marketplaceDownloads,
        label: marketplaceData.sourceLabels.marketplaceDownloads,
        sublabel: 'Official marketplace API',
        icon: BarChart3,
      },
    ];

    if (!marketplaceData.tillDateAcquisition?.value && marketplaceData.approxTotalDownloads) {
      items.push({
        id: 'approx-total-downloads',
        value: marketplaceData.approxTotalDownloads,
        label: marketplaceData.sourceLabels.approxTotalDownloads,
        sublabel: 'Approx. from public marketplace metrics',
        icon: BarChart3,
      });
    }

    items.push(
      {
        id: 'rating',
        value:
          marketplaceData.rating !== '-'
            ? `${marketplaceData.rating}★`
            : '-',
        label: marketplaceData.sourceLabels.rating,
        sublabel:
          marketplaceData.ratingCount !== '-'
            ? `${marketplaceData.ratingCount} review${marketplaceData.ratingCount === '1' ? '' : 's'}`
            : 'Awaiting more reviews',
        icon: Star,
      },
      {
        id: 'version',
        value: marketplaceData.version,
        label: marketplaceData.sourceLabels.version,
        sublabel: formatPublishedDate(marketplaceData.lastUpdated) || 'Latest published release',
        icon: Code,
      }
    );

    if (marketplaceData.tillDateAcquisition?.value) {
      items.splice(2, 0, {
        id: 'till-date-acquisition',
        value: marketplaceData.tillDateAcquisition.value,
        label: marketplaceData.tillDateAcquisition.label,
        sublabel: 'Official publisher resource',
        icon: Download,
      });
    }

    return items;
  }, [marketplaceData]);

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo/Icon */}
        <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl animate-pulse-glow sm:h-32 sm:w-32">
            <img 
              src={getTechnologyAsset("icon_white.svg")}
              alt="Code-XR logo" 
              className="h-20 w-20 sm:h-24 sm:w-24"
            />
          </div>
        </div>

        <div className={`mb-6 flex flex-wrap items-center justify-center gap-3 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center space-x-2 rounded-full border border-neon-blue/30 bg-neon-blue/10 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-neon-blue animate-pulse"></div>
            <span className="text-sm font-medium text-neon-blue">{latestRelease.copyBlocks.heroBadge}</span>
          </div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-yellow-500/30 bg-linear-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-300">Accepted at IEEE VISSOFT 2025</span>
          </div>
        </div>

        {/* Main Title */}
        <div className={`mb-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl md:text-6xl xl:text-7xl">
            <span className="text-white">Welcome to</span>{' '}
            <span className="text-gradient bg-linear-to-r from-white to-neon-blue bg-clip-text text-transparent">
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
                <div className={`p-1.5 rounded-lg bg-linear-to-r ${badge.color} group-hover:scale-110 transition-transform duration-300`}>
                  <badge.icon size={12} className="text-white" />
                </div>
                <span className="text-white font-medium text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className={`mb-8 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric, index) => (
              <MetricPanel
                key={metric.id}
                icon={metric.icon}
                value={metric.value}
                label={metric.label}
                detail={metric.sublabel}
                align="center"
                className={`animate-scale-in ${
                  metrics.length % 2 === 1 && index === metrics.length - 1
                    ? 'sm:col-span-2 lg:col-span-1'
                    : ''
                }`}
                style={{ animationDelay: `${800 + index * 100}ms` }}
              />
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
              <span>{latestRelease.copyBlocks.heroPrimaryCta}</span>
            </a>
            <a
              href="#latest-release"
              className="btn-secondary flex items-center space-x-2 justify-center group"
            >
              <Play size={20} className="group-hover:scale-110 transition-transform" />
              <span>{latestRelease.copyBlocks.heroSecondaryCta}</span>
            </a>
          </div>
        </div>

        {/* Scroll Arrow */}
        <div className={`transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <a href="#latest-release" className="block">
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
