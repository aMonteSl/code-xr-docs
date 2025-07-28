import React from 'react';

const Technologies = () => {
  const technologies = [
    {
      name: 'Node.js',
      description: 'Backend processing and extension infrastructure built on Node.js runtime.',
      logo: '/assets/technologies/nodejs.svg',
      color: 'from-green-400 to-emerald-500',
      delay: '0ms',
      url: 'https://nodejs.org/'
    },
    {
      name: 'BabiaXR',
      description: 'Data visualization library specialized in XR environments.',
      logo: '/assets/technologies/babiaxr.png',
      color: 'from-purple-400 to-pink-500',
      delay: '200ms',
      url: 'https://babiaxr.gitlab.io/'
    },
    {
      name: 'A-Frame',
      description: 'Web framework for building virtual reality experiences with HTML.',
      logo: '/assets/technologies/aframe.png',
      color: 'from-red-400 to-pink-500',
      delay: '400ms',
      url: 'https://aframe.io/'
    },
    {
      name: 'TypeScript',
      description: 'Type-safe development for robust and maintainable VS Code extension.',
      logo: '/assets/technologies/typescript.svg',
      color: 'from-blue-600 to-indigo-500',
      delay: '600ms',
      url: 'https://www.typescriptlang.org/'
    },
    {
      name: 'Python',
      description: 'Code analysis and metrics calculation through Python integration. (library lizard for CCN)',
      logo: '/assets/technologies/python.svg',
      color: 'from-yellow-400 to-blue-500',
      delay: '800ms',
      url: 'https://pypi.org/project/lizard/'
    },
    {
      name: 'VS Code API',
      description: 'Extension development interface for integrating with Visual Studio Code editor.',
      logo: '/assets/technologies/vscode.svg',
      color: 'from-blue-500 to-indigo-600',
      delay: '1000ms',
      url: 'https://code.visualstudio.com/api/references/vscode-api'
    }
  ];

  return (
    <section id="technologies" className="py-20 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-purple-400 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 170, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 170, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Technologies</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              We Use
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore the tools and frameworks that power the Code-XR experience.
          </p>
        </div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {technologies.map((tech, index) => (
            <a
              key={index}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card-hover p-8 group animate-scale-in block cursor-pointer transform hover:scale-105 transition-all duration-300"
              style={{animationDelay: tech.delay}}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Logo */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${tech.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-blue-hover p-3`}>
                <img 
                  src={tech.logo} 
                  alt={tech.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-neon-blue transition-colors duration-300">
                {tech.name}
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm group-hover:text-gray-200 transition-colors duration-300">
                {tech.description}
              </p>

              {/* Hover Effect Line */}
              <div className="mt-6 h-0.5 bg-gradient-to-r from-transparent via-neon-blue to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              {/* External Link Indicator */}
              <div className="mt-4 flex items-center text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-medium">Visit Website →</span>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-16" data-aos="fade-up" data-aos-delay="1200">
          <div className="glass-card p-6 max-w-2xl mx-auto">
            <p className="text-gray-300 text-lg">
              Built with modern technologies to deliver the best XR development experience in VS Code
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Technologies;
