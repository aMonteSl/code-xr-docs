import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, Zap, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const QuickStartGuide = () => {
  // Carousel state
  const [currentStep, setCurrentStep] = useState(0);

  // Animation variants for carousel
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 30 
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    })
  };

  const steps = [
    {
      id: 1,
      title: "Initialize Workspace",
      description: "Explore Code-XR's user interface, designed to be simple and intuitive",
      icon: <Settings size={24} />,
      details: [
        "Customize server launch options",
        "Configure XR visualization options: Scenario (3D environment), Chart color, Background color, Ground color",
        "Adapt analysis options: Debounce time, Charts you want to see, Data to show in XR analysis, LivePanel theme (light/dark)"
      ],
      tip: "Remember: if you're using VR headsets, you need to launch the server in HTTPS mode"
    },
    {
      id: 2,
      title: "Launch Analysis",
      description: "Discover the different types of analysis available in Code-XR",
      icon: <Play size={24} />,
      details: [
        "Available analysis types: By file → (LivePanel or XR), By directory → (LivePanel or XR), HTML DOM visualization → (XR experience)",
        "Launch analysis with right-click: On individual file, choose how to visualize it. On directory, choose whether to include subdirectories (deep) or not. Anywhere in project → analyze everything",
        "Use Code-XR UI: Visualize files by language or directory tree. Click any item to automatically launch analysis according to current configuration"
      ],
      tip: "All analysis can be deep (includes subdirectories) or shallow"
    },
    {
      id: 3,
      title: "Experiment in Real Time",
      description: "Code while watching your code metrics change in real time",
      icon: <Zap size={24} />,
      details: [
        "Program while seeing how your code metrics change in real time",
        "Refactor functions if you detect high cyclomatic complexity (CCN)",
        "Try different debounce time values until you find the one that fits your rhythm"
      ],
      tip: "Short and reusable functions improve maintainability"
    },
    {
      id: 4,
      title: "Save for the Next Time",
      description: "Keep your personalized configuration for future sessions",
      icon: <Search size={24} />,
      details: [
        "Save your custom configuration easily from the Analysis Settings menu",
        "Your preferences will be maintained the next time you open VS Code, even between different projects",
        "XR environment settings (like scenario) will also be preserved between sessions",
        "If you want to start fresh, you can delete your profile and restore default values"
      ],
      tip: "Your settings persist across projects and VS Code sessions"
    }
  ];

  // Navigation functions
  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const goToStep = (index) => {
    setCurrentStep(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentStep((prev) => (prev + 1) % steps.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
      } else if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        setCurrentStep(parseInt(event.key) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps.length]);

  return (
    <section id="quick-start-guide" className="py-20 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 170, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 170, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={titleVariants}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            variants={titleVariants}
          >
            <span className="text-white">Quick Start</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-green-400 bg-clip-text text-transparent">
              Guide
            </span>
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            variants={titleVariants}
          >
            Master Code-XR in four comprehensive steps. From workspace initialization to real-time experimentation.
          </motion.p>
        </motion.div>

        {/* Carousel Container */}
        <motion.div 
          className="relative max-w-4xl mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          {/* Step Counter */}
          <motion.div 
            className="text-center mb-8"
            variants={titleVariants}
          >
            <span className="text-neon-blue font-semibold text-lg">
              Step {currentStep + 1} of {steps.length}
            </span>
          </motion.div>

          {/* Carousel Wrapper */}
          <div className="relative overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait" custom={currentStep}>
              <motion.div
                key={currentStep}
                custom={currentStep}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                {/* Current Step Card */}
                <div className="glass-card p-8 lg:p-12 relative overflow-hidden min-h-[500px] flex flex-col justify-center">
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-purple-500/5" />
                  
                  <div className="relative z-10">
                    {/* Step Header */}
                    <motion.div 
                      className="flex flex-col sm:flex-row items-center sm:items-start mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                    >
                      <motion.div 
                        className="w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-blue to-purple-500 text-black flex items-center justify-center font-bold text-2xl mr-0 sm:mr-6 mb-4 sm:mb-0"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        {steps[currentStep].id}
                      </motion.div>
                      <div className="text-center sm:text-left flex-1">
                        <motion.div 
                          className="flex items-center justify-center sm:justify-start mb-3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <div className="text-neon-blue mr-3">
                            {steps[currentStep].icon}
                          </div>
                        </motion.div>
                        <motion.h3 
                          className="text-3xl lg:text-4xl font-bold text-white mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.6 }}
                        >
                          {steps[currentStep].title}
                        </motion.h3>
                        <motion.p 
                          className="text-xl text-gray-300 leading-relaxed"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.6 }}
                        >
                          {steps[currentStep].description}
                        </motion.p>
                      </div>
                    </motion.div>

                    {/* Details */}
                    <motion.div 
                      className="space-y-6 mb-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      {steps[currentStep].details.map((detail, detailIndex) => (
                        <motion.div 
                          key={detailIndex} 
                          className="flex items-start space-x-4"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: 0.7 + (detailIndex * 0.1), 
                            duration: 0.5 
                          }}
                        >
                          <motion.div 
                            className="w-3 h-3 rounded-full bg-neon-blue mt-2 flex-shrink-0"
                            whileHover={{ scale: 1.5 }}
                          />
                          <span className="text-gray-300 text-lg leading-relaxed">{detail}</span>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Tip */}
                    {steps[currentStep].tip && (
                      <motion.div 
                        className="bg-neon-blue/10 border border-neon-blue/20 rounded-xl p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        whileHover={{ 
                          backgroundColor: 'rgba(0, 170, 255, 0.15)',
                          borderColor: 'rgba(0, 170, 255, 0.3)'
                        }}
                      >
                        <div className="flex items-start space-x-4">
                          <motion.div 
                            className="w-6 h-6 rounded-full bg-neon-blue/20 flex items-center justify-center mt-1 flex-shrink-0"
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="text-neon-blue text-sm font-bold">💡</span>
                          </motion.div>
                          <div>
                            <span className="text-neon-blue font-semibold text-lg">Tip: </span>
                            <span className="text-gray-300 text-lg">{steps[currentStep].tip}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <motion.div 
            className="flex items-center justify-between mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Previous Button */}
            <motion.button
              onClick={prevStep}
              className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-blue/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              tabIndex={0}
              aria-label="Previous step"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Previous</span>
            </motion.button>

            {/* Step Dots */}
            <div className="flex items-center space-x-3">
              {steps.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'bg-neon-blue scale-125' 
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.8 }}
                  tabIndex={0}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <motion.button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-blue/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              tabIndex={0}
              aria-label="Next step"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={20} />
            </motion.button>
          </motion.div>

          {/* Keyboard Navigation Hint */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="text-gray-500 text-sm">
              Use arrow keys, number keys (1-4), or click the buttons to navigate
            </span>
          </motion.div>
        </motion.div>

        {/* Help Section */}
        <motion.div 
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={titleVariants}
        >
          <motion.div 
            className="glass-card p-8 max-w-2xl mx-auto"
            variants={containerVariants}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 25px 50px -12px rgba(0, 170, 255, 0.25)'
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.h3 
              className="text-2xl font-bold text-white mb-4"
              variants={titleVariants}
            >
              Ready to Start Your XR Journey?
            </motion.h3>
            <motion.p 
              className="text-gray-300 mb-6"
              variants={titleVariants}
            >
              Follow these steps and transform how you understand and interact with your code
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={containerVariants}
            >
              <motion.a
                href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center space-x-2 justify-center"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 10px 25px rgba(0, 170, 255, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                tabIndex={0}
              >
                <Play size={16} />
                <span>Install Code-XR</span>
              </motion.a>
              <motion.a
                href="#"
                className="btn-secondary flex items-center space-x-2 justify-center"
                whileHover={{ 
                  scale: 1.05,
                  borderColor: 'rgba(0, 170, 255, 0.6)'
                }}
                whileTap={{ scale: 0.95 }}
                tabIndex={0}
              >
                <span>View Documentation</span>
              </motion.a>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default QuickStartGuide;
