import React from 'react';

const Features = () => {
  const features = [
    {
      icon: "🌐",
      title: "3D/XR Code Exploration",
      description: "Navigate through your codebase in immersive 3D environments. Visualize file structures, dependencies, and code relationships in extended reality space.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "📊",
      title: "Cyclomatic Complexity Analysis",
      description: "Understand code complexity at a glance with visual representations of cyclomatic complexity metrics across your entire project.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "⏱️",
      title: "Code Evolution Timeline",
      description: "Track how your code evolves over time with interactive visualizations showing changes, additions, and improvements across commits.",
      gradient: "from-green-500 to-teal-500"
    }
  ];

  return (
    <section id="features" className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Code-XR brings cutting-edge visualization technologies to software analysis, 
            making complex code metrics intuitive and interactive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Gradient border effect on hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm`}></div>
              
              {/* Icon */}
              <div className="text-4xl mb-6 text-center">
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
