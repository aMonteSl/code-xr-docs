import React from 'react';
import { Monitor, Zap, BarChart3, FolderOpen } from 'lucide-react';

const Features = () => {
  // Custom icon components
  const CustomXRIcon = ({ size = 32, className = "" }) => (
    <img 
      src="/icon_white.svg" 
      alt="XR" 
      className={className}
      style={{ width: size, height: size }}
    />
  );

  const CustomVSCodeIcon = ({ size = 32, className = "" }) => (
    <img 
      src="/assets/technologies/vscode.svg" 
      alt="VS Code" 
      className={className}
      style={{ width: size, height: size }}
    />
  );

  const features = [
    {
      icon: Monitor,
      title: 'LivePanel Visualization',
      description: 'Render your data in a standard HTML/CSS panel—like a normal web page—complete with beautiful charts. Perfect when you want a quick overview without leaving your favorite editor.',
      color: 'from-blue-400 to-cyan-400',
      delay: '0ms'
    },
    {
      icon: CustomXRIcon,
      title: 'XR Visualization',
      description: 'Take your graphics to the next level with BabylonXR: immersive and dynamic visualizations that react in real-time to your code changes. Watch your data come to life!',
      color: 'from-purple-400 to-pink-400',
      delay: '200ms'
    },
    {
      icon: CustomVSCodeIcon,
      title: 'Full Integrated VS Code',
      description: 'View your analysis both in a sidebar panel within VS Code and in a web tab. Total flexibility to choose your work context without breaking the flow.',
      color: 'from-green-400 to-blue-400',
      delay: '400ms'
    },
    {
      icon: Zap,
      title: 'Real Time Analysis',
      description: 'With a simple debounce your metrics update instantly. 🚀 Supports multiple simultaneous analysis to compare, overlay and extrapolate without breaking a sweat.',
      color: 'from-yellow-400 to-orange-400',
      delay: '600ms'
    },
    {
      icon: BarChart3,
      title: 'Metrics',
      description: 'Get CCN, CCN Density, number of functions, classes, parameters per function, lines of code, comment lines and much more. All essential KPIs of your codebase at a single glance.',
      color: 'from-indigo-400 to-purple-400',
      delay: '800ms'
    },
    {
      icon: FolderOpen,
      title: 'Files and Directories',
      description: 'Analyze files and directories in more than 24 languages, including HTML with its own VisualizeDOM. Navigate, inspect and understand your project like never before.',
      color: 'from-teal-400 to-green-400',
      delay: '1000ms'
    }
  ];

  return (
    <section id="features" className="py-20 bg-black relative overflow-hidden">
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
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of coding with immersive XR capabilities built directly into VS Code
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
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-blue-hover`}>
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
              <div className="mt-6 h-0.5 bg-gradient-to-r from-transparent via-neon-blue to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16" data-aos="fade-up" data-aos-delay="800">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to transform your development experience?
            </h3>
            <p className="text-gray-300 mb-6">
              Join thousands of developers already coding in the future with Code-XR
            </p>
            <a
              href="#install"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>Get Started Now</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
