import React from 'react';
import { Monitor, Users, BarChart3, Settings, SlidersHorizontal } from 'lucide-react';
import { getTechnologyAsset } from '../utils/assets';
import { latestRelease } from '../content/releaseContent';

const Features = () => {
  // Custom icon components
  const CustomXRIcon = ({ size = 32, className = "" }) => (
    <img 
      src={getTechnologyAsset("icon_white.svg")}
      alt="Code-XR XR feature icon" 
      className={className}
      style={{ width: size, height: size }}
    />
  );

  const features = [
    {
      icon: CustomXRIcon,
      title: 'Unified Analysis Engine',
      description: 'Files, directories, and DOM flows now share the same Python-backed analysis contract, which keeps LivePanel and XR views aligned with the real backend output.',
      color: 'from-blue-400 to-cyan-400',
      delay: '0ms'
    },
    {
      icon: Users,
      title: 'Collaborative XR and DOM Rooms',
      description: 'Live sessions now synchronize mapping changes, chart refreshes, screen layout updates, and visible presence markers across connected users.',
      color: 'from-purple-400 to-pink-400',
      delay: '200ms'
    },
    {
      icon: Monitor,
      title: 'Shared Virtual Screens',
      description: 'Project a desktop, window, or tab into the immersive scene, with synchronized layout controls and shared video or audio playback for connected clients.',
      color: 'from-green-400 to-blue-400',
      delay: '400ms'
    },
    {
      icon: SlidersHorizontal,
      title: 'In-Scene Mapping and Recovery',
      description: 'Chart remapping now happens directly inside XR, with validation and automatic rollback when a new dimension combination produces invalid geometry.',
      color: 'from-yellow-400 to-orange-400',
      delay: '600ms'
    },
    {
      icon: BarChart3,
      title: 'Expanded Real Metrics',
      description: 'Expose richer values like complexity bands, ratios, aggregate nesting depth, and function-size indicators to drive more meaningful LivePanel and XR mappings.',
      color: 'from-indigo-400 to-purple-400',
      delay: '800ms'
    },
    {
      icon: Settings,
      title: 'Guided Python Environment Recovery',
      description: 'The Python environment now has dedicated status, verification, and reinitialization flows inside VS Code, making setup more robust and easier to recover.',
      color: 'from-teal-400 to-green-400',
      delay: '1000ms'
    }
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-transparent py-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-400 opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Powerful</span>{' '}
            <span className="text-gradient bg-linear-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {latestRelease.copyBlocks.featuresIntro}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card-hover p-8 group animate-scale-in"
              style={{animationDelay: feature.delay}}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-xl bg-linear-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-blue-hover`}>
                <feature.icon size={32} className="text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-neon-blue transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect Line */}
              <div className="mt-6 h-0.5 bg-linear-to-r from-transparent via-neon-blue to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16" data-aos="fade-up" data-aos-delay="800">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to explore the current release?
            </h3>
            <p className="text-gray-300 mb-6">
              Move from the release overview into the full gallery and installation workflow without losing the existing visual style of the site.
            </p>
            <a
              href="#latest-release"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>Explore v1.1.0</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
