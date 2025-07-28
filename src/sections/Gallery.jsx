import React, { useState } from 'react';
import { Play, Maximize, ExternalLink } from 'lucide-react';

const Gallery = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const galleryItems = [
    {
      id: 1,
      type: 'video',
      title: '3D Code Navigation',
      description: 'Navigate through your codebase in immersive 3D space',
      thumbnail: '/api/placeholder/400/250',
      videoUrl: '#',
      category: 'Navigation'
    },
    {
      id: 2,
      type: 'video',
      title: 'VR Debugging Session',
      description: 'Debug applications directly in virtual reality',
      thumbnail: '/api/placeholder/400/250',
      videoUrl: '#',
      category: 'Debugging'
    },
    {
      id: 3,
      type: 'image',
      title: 'Multi-Screen Workspace',
      description: 'Organize unlimited virtual screens in 3D space',
      thumbnail: '/api/placeholder/400/250',
      category: 'Workspace'
    },
    {
      id: 4,
      type: 'video',
      title: 'Collaborative XR Coding',
      description: 'Code together with your team in shared virtual space',
      thumbnail: '/api/placeholder/400/250',
      videoUrl: '#',
      category: 'Collaboration'
    },
    {
      id: 5,
      type: 'image',
      title: 'Data Visualization',
      description: 'Visualize complex data structures in 3D',
      thumbnail: '/api/placeholder/400/250',
      category: 'Visualization'
    },
    {
      id: 6,
      type: 'video',
      title: 'Real-time Rendering',
      description: 'See your code changes rendered instantly in XR',
      thumbnail: '/api/placeholder/400/250',
      videoUrl: '#',
      category: 'Rendering'
    }
  ];

  const categories = ['All', ...new Set(galleryItems.map(item => item.category))];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredItems = activeCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <section id="gallery" className="py-20 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-400 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Experience</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Code-XR
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See Code-XR in action through interactive demos and real-world use cases
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12" data-aos="fade-up" data-aos-delay="200">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-neon-blue text-black glow-blue'
                  : 'glass-card text-gray-300 hover:text-white hover:border-neon-blue/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="glass-card-hover group cursor-pointer overflow-hidden animate-scale-in"
              style={{animationDelay: `${index * 100}ms`}}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              onClick={() => item.type === 'video' && setSelectedVideo(item)}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                <div className="w-full h-48 bg-gradient-to-br from-neon-blue/20 to-purple-400/20 flex items-center justify-center">
                  {/* Placeholder for actual thumbnail */}
                  <div className="text-6xl text-neon-blue opacity-50">
                    {item.type === 'video' ? '▶' : '🖼'}
                  </div>
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <div className="bg-neon-blue rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play size={24} className="text-black fill-current" />
                    </div>
                  ) : (
                    <div className="bg-white/20 rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Maximize size={24} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/70 text-neon-blue text-sm rounded-full backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div 
              className="glass-card max-w-4xl w-full overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">{selectedVideo.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="w-full h-64 md:h-96 bg-gradient-to-br from-neon-blue/20 to-purple-400/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play size={64} className="text-neon-blue mx-auto mb-4" />
                    <p className="text-gray-300">Video player would be embedded here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16" data-aos="fade-up" data-aos-delay="600">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Want to see more?
            </h3>
            <p className="text-gray-300 mb-6">
              Visit our documentation for detailed tutorials and examples
            </p>
            <a
              href="#"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <ExternalLink size={20} />
              <span>View Documentation</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
