import React from 'react';

const Install = () => {
  const installMethods = [
    {
      title: "VS Code Marketplace",
      description: "Install directly from the Visual Studio Code Extensions Marketplace",
      steps: [
        "Open VS Code",
        "Go to Extensions (Ctrl+Shift+X)",
        "Search for 'Code-XR'",
        "Click Install"
      ],
      primary: true
    },
    {
      title: "Command Line",
      description: "Install using the VS Code command line interface",
      steps: [
        "Open terminal",
        "Run: code --install-extension code-xr",
        "Restart VS Code",
        "Enjoy!"
      ],
      primary: false
    }
  ];

  return (
    <section id="install" className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Get Started
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Install Code-XR and start exploring your code in immersive 3D environments. 
            Choose your preferred installation method below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {installMethods.map((method, index) => (
            <div
              key={index}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
                method.primary 
                  ? 'border-blue-500 shadow-blue-500/20 dark:shadow-blue-500/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
              data-aos="fade-up"
              data-aos-delay={index * 200}
            >
              {method.primary && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Recommended
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {method.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {method.description}
              </p>

              <div className="space-y-4 mb-8">
                {method.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {stepIndex + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{step}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button className={method.primary ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  {method.primary ? 'Install from Marketplace' : 'Copy Command'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center" data-aos="fade-up">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              System Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">VS Code</h4>
                <p className="text-gray-600 dark:text-gray-300">Version 1.80.0 or higher</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Operating System</h4>
                <p className="text-gray-600 dark:text-gray-300">Windows, macOS, or Linux</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Memory</h4>
                <p className="text-gray-600 dark:text-gray-300">Minimum 4GB RAM recommended</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Install;
