import React, { useState } from 'react';
import { Play, Maximize, ExternalLink } from 'lucide-react';

const Gallery = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Helper function to extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Helper function to get YouTube thumbnail
  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/api/placeholder/400/250';
  };

  const galleryItems = [
    // Interface & Tutorial
    {
      id: 1,
      type: 'video',
      title: 'Code-XR Interface Tutorial',
      description: 'Complete walkthrough of the Code-XR user interface and plugin functionality',
      videoUrl: 'https://youtu.be/KRgLdLZJXHA',
      category: 'Interface'
    },
    
    // File Analysis
    {
      id: 2,
      type: 'video',
      title: 'File Analysis - LivePanel Mode',
      description: 'Analyze individual files using the LivePanel visualization mode',
      videoUrl: 'https://youtu.be/n5ZcjlR4pPc',
      category: 'File Analysis'
    },
    {
      id: 3,
      type: 'video',
      title: 'File Analysis - XR Mode',
      description: 'Immersive XR analysis of individual code files with 3D visualization',
      videoUrl: 'https://youtu.be/38jGwFGORvc',
      category: 'File Analysis'
    },
    
    // Directory Analysis
    {
      id: 4,
      type: 'video',
      title: 'Directory Analysis - LivePanel',
      description: 'Analyze entire directories and their structure using LivePanel mode',
      videoUrl: 'https://youtu.be/sPWjcgV-gZQ',
      category: 'Directory Analysis'
    },
    {
      id: 5,
      type: 'video',
      title: 'Directory Analysis - XR Mode',
      description: 'Navigate and analyze directory structures in immersive XR environment',
      videoUrl: 'https://youtu.be/TnfS2SevtWU',
      category: 'Directory Analysis'
    },
    
    // Project Analysis
    {
      id: 6,
      type: 'video',
      title: 'Full Project Analysis',
      description: 'Comprehensive project analysis using both LivePanel and XR modes',
      videoUrl: 'https://youtu.be/NluAHe3BQu8',
      category: 'Project Analysis'
    },
    
    // Special Features
    {
      id: 7,
      type: 'video',
      title: 'HTML DOM Tree Visualization',
      description: 'Visualize HTML DOM structures as interactive 3D trees in XR space',
      videoUrl: 'https://youtu.be/110b-AergdU',
      category: 'Special Features'
    },
    {
      id: 8,
      type: 'video',
      title: 'Augmented Reality Experience',
      description: 'Experience Code-XR in Augmented Reality mode with real-world integration',
      videoUrl: 'https://youtu.be/d7fojpP90Dk',
      category: 'AR Experience'
    }
  ];

  const categories = ['All', ...new Set(galleryItems.map(item => item.category))];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredItems = activeCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  // Organize items by category for "All" view
  const organizedByCategory = {
    'Interface': galleryItems.filter(item => item.category === 'Interface'),
    'File Analysis': galleryItems.filter(item => item.category === 'File Analysis'),
    'Directory Analysis': galleryItems.filter(item => item.category === 'Directory Analysis'),
    'Project Analysis': galleryItems.filter(item => item.category === 'Project Analysis'),
    'Special Features': galleryItems.filter(item => item.category === 'Special Features'),
    'AR Experience': galleryItems.filter(item => item.category === 'AR Experience')
  };

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
        {activeCategory === 'All' ? (
          // Organized view for "All" category
          <div className="space-y-16">
            {Object.entries(organizedByCategory).map(([categoryName, items]) => (
              items.length > 0 && (
                <div key={categoryName}>
                  {/* Category Title */}
                  <div className="mb-8" data-aos="fade-up">
                    <h3 className="text-2xl font-bold text-white mb-2">{categoryName}</h3>
                    <div className="w-20 h-1 bg-gradient-to-r from-neon-blue to-purple-400 rounded"></div>
                  </div>
                  
                  {/* Category Videos Grid */}
                  <div className={`grid gap-8 ${items.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : items.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="glass-card-hover group cursor-pointer overflow-hidden animate-scale-in"
                        style={{animationDelay: `${index * 100}ms`}}
                        data-aos="fade-up"
                        data-aos-delay={index * 100}
                        onClick={() => setSelectedVideo(item)}
                      >
                        {/* Thumbnail */}
                        <div className="relative overflow-hidden">
                          <div className="w-full h-48 bg-gradient-to-br from-neon-blue/20 to-purple-400/20 relative">
                            {/* YouTube Thumbnail */}
                            <img 
                              src={getYouTubeThumbnail(item.videoUrl)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            {/* Fallback */}
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-purple-400/20 hidden items-center justify-center">
                              <div className="text-6xl text-neon-blue opacity-50">▶</div>
                            </div>
                          </div>
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-neon-blue rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Play size={24} className="text-black fill-current" />
                            </div>
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
                </div>
              )
            ))}
          </div>
        ) : (
          // Regular grid for specific categories
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="glass-card-hover group cursor-pointer overflow-hidden animate-scale-in"
                style={{animationDelay: `${index * 100}ms`}}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                onClick={() => setSelectedVideo(item)}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden">
                  <div className="w-full h-48 bg-gradient-to-br from-neon-blue/20 to-purple-400/20 relative">
                    {/* YouTube Thumbnail */}
                    <img 
                      src={getYouTubeThumbnail(item.videoUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-purple-400/20 hidden items-center justify-center">
                      <div className="text-6xl text-neon-blue opacity-50">▶</div>
                    </div>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-neon-blue rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play size={24} className="text-black fill-current" />
                    </div>
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
        )}

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
                <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden">
                  {/* YouTube Embed */}
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.videoUrl)}?autoplay=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <div className="mt-4">
                  <p className="text-gray-300 text-sm">{selectedVideo.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16" data-aos="fade-up" data-aos-delay="600">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Experience Code-XR?
            </h3>
            <p className="text-gray-300 mb-6">
              Install the extension and start transforming your development workflow with immersive XR visualization
            </p>
            <a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <ExternalLink size={20} />
              <span>Install Code-XR</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
