import React from 'react';
import { getSrcAsset } from '../utils/assets';

const Gallery = () => {
  const galleryItems = [
    {
      title: "3D Code Structure",
      description: "Explore your codebase in three dimensions",
      image: getSrcAsset("vite.svg"), // Placeholder
      category: "3D Visualization"
    },
    {
      title: "Complexity Heatmap",
      description: "Visual representation of code complexity",
      image: getSrcAsset("react.svg"), // Placeholder
      category: "Analysis"
    },
    {
      title: "Evolution Timeline",
      description: "Track code changes over time",
      image: getSrcAsset("vite.svg"), // Placeholder
      category: "Timeline"
    },
    {
      title: "XR Interface",
      description: "Immersive extended reality experience",
      image: getSrcAsset("react.svg"), // Placeholder
      category: "XR Experience"
    },
    {
      title: "Dependency Graph",
      description: "Interactive dependency visualization",
      image: "/public/vite.svg", // Placeholder
      category: "Dependencies"
    },
    {
      title: "Metrics Dashboard",
      description: "Comprehensive code metrics overview",
      image: "/src/assets/react.svg", // Placeholder
      category: "Dashboard"
    }
  ];

  return (
    <section id="gallery" className="section-padding bg-gray-50 dark:bg-gray-800/50">
      <div className="container-custom">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            See Code-XR in Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the future of code visualization with these screenshots and demos 
            showcasing Code-XR's immersive capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Image Container */}
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-16 h-16 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                />
                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {item.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16" data-aos="fade-up">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Want to see more? Check out our interactive demos and documentation.
          </p>
          <a 
            href="#install"
            className="btn-primary"
          >
            Try Code-XR Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
