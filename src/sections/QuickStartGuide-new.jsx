import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, Zap, Settings, ChevronLeft, ChevronRight, Lightbulb, ArrowRight, CheckCircle, Clock } from 'lucide-react';

const QuickStartGuide = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Enhanced step data with better organization
  const steps = [
    {
      id: 1,
      title: "Install and Configure",
      description: "Get Code-XR ready in your VS Code environment",
      icon: <Settings size={32} />,
      gradient: "from-emerald-400 via-teal-400 to-cyan-400",
      bgPattern: "emerald",
      details: [
        "Install Code-XR from the VS Code Marketplace with one click",
        "Configure your preferred analysis settings through the intuitive UI",
        "Set up XR environment preferences (scenarios, lighting, interaction modes)"
      ],
      tip: "Start with default settings - you can always customize later as you explore",
      duration: "2 min"
    },
    {
      id: 2,
      title: "Choose Your Analysis",
      description: "Discover the different types of analysis available in Code-XR",
      icon: <Play size={32} />,
      gradient: "from-blue-400 via-indigo-400 to-purple-400",
      bgPattern: "blue",
      details: [
        "Available analysis types: By file → (LivePanel or XR), By directory → (LivePanel or XR), HTML DOM visualization → (XR experience)",
        "Launch analysis with right-click: On individual file, choose how to visualize it. On directory, choose whether to include subdirectories (deep) or not. Anywhere in project → analyze everything",
        "Use Code-XR UI: Visualize files by language or directory tree. Click any item to automatically launch analysis according to current configuration"
      ],
      tip: "All analysis can be deep (includes subdirectories) or shallow",
      duration: "3 min"
    },
    {
      id: 3,
      title: "Experiment in Real Time",
      description: "Code while watching your code metrics change in real time",
      icon: <Zap size={32} />,
      gradient: "from-purple-400 via-pink-400 to-rose-400",
      bgPattern: "purple",
      details: [
        "Program while seeing how your code metrics change in real time",
        "Refactor functions if you detect high cyclomatic complexity (CCN)",
        "Try different debounce time values until you find the one that fits your rhythm"
      ],
      tip: "Short and reusable functions improve maintainability",
      duration: "5 min"
    },
    {
      id: 4,
      title: "Save for the Next Time",
      description: "Keep your personalized configuration for future sessions",
      icon: <Search size={32} />,
      gradient: "from-orange-400 via-red-400 to-pink-400",
      bgPattern: "orange",
      details: [
        "Save your custom configuration easily from the Analysis Settings menu",
        "Your preferences will be maintained the next time you open VS Code, even between different projects",
        "XR environment settings (like scenario) will also be preserved between sessions",
        "If you want to start fresh, you can delete your profile and restore default values"
      ],
      tip: "Your settings persist across projects and VS Code sessions",
      duration: "1 min"
    }
  ];

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (index) => {
    setCurrentStep(index);
  };

  const markComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  // Auto-advance effect (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      markComplete(steps[currentStep].id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextStep();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prevStep();
      } else if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        goToStep(parseInt(event.key) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section id="quick-start-guide" className="py-20 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0, 170, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.03) 0%, transparent 50%)
          `
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Quick Start</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Guide
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Master Code-XR in four comprehensive steps. From workspace initialization to real-time experimentation.
          </p>
          
          {/* Progress Overview */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Clock className="w-5 h-5 text-neon-blue" />
            <span className="text-gray-300">Total time: ~11 minutes</span>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-gray-300">{completedSteps.length}/{steps.length} completed</span>
          </div>
        </motion.div>

        {/* Step Navigation Pills */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex space-x-2 bg-black/40 backdrop-blur-sm p-2 rounded-2xl border border-white/10">
            {steps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  currentStep === index
                    ? 'text-black shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep === index && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-xl`}
                    layoutId="activeStep"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <span className="relative z-10 flex items-center space-x-2">
                  {completedSteps.includes(step.id) && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>{step.id}. {step.title.split(' ')[0]}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Card Container */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -300, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative"
            >
              {/* Main Step Card */}
              <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Header with Gradient */}
                <div className={`bg-gradient-to-r ${steps[currentStep].gradient} p-1`}>
                  <div className="bg-black/90 rounded-t-3xl p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        {/* Step Number & Icon */}
                        <div className={`w-20 h-20 bg-gradient-to-r ${steps[currentStep].gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <div className="text-black font-bold">
                            {steps[currentStep].icon}
                          </div>
                        </div>
                        
                        {/* Title & Description */}
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-gray-400 text-lg font-medium">Step {steps[currentStep].id}</span>
                            <div className="flex items-center space-x-1 text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{steps[currentStep].duration}</span>
                            </div>
                          </div>
                          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                            {steps[currentStep].title}
                          </h3>
                          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                            {steps[currentStep].description}
                          </p>
                        </div>
                      </div>

                      {/* Completion Status */}
                      {completedSteps.includes(steps[currentStep].id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-green-400 text-sm font-medium">Completed</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-8 space-y-8">
                  {/* Details List */}
                  <div className="space-y-6">
                    <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <ArrowRight className="w-6 h-6 text-neon-blue mr-3" />
                      What you'll do:
                    </h4>
                    
                    <div className="space-y-4">
                      {steps[currentStep].details.map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                          whileHover={{ x: 10 }}
                        >
                          <div className={`w-8 h-8 bg-gradient-to-r ${steps[currentStep].gradient} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
                            <span className="text-black font-bold text-sm">{index + 1}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                            {detail}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Pro Tip */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`bg-gradient-to-r ${steps[currentStep].gradient} p-1 rounded-2xl`}
                  >
                    <div className="bg-black/90 rounded-2xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${steps[currentStep].gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Lightbulb className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h5 className="text-lg font-bold text-white mb-2">Pro Tip</h5>
                          <p className="text-gray-300 leading-relaxed">
                            {steps[currentStep].tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Navigation Footer */}
                <div className="bg-black/50 border-t border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <motion.button
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-300"
                      whileHover={currentStep > 0 ? { scale: 1.05, x: -5 } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Previous</span>
                    </motion.button>

                    <div className="flex space-x-2">
                      {steps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentStep
                              ? `bg-gradient-to-r ${steps[currentStep].gradient}`
                              : completedSteps.includes(steps[index].id)
                              ? 'bg-green-500'
                              : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>

                    <motion.button
                      onClick={nextStep}
                      disabled={currentStep === steps.length - 1}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-purple-400 hover:from-neon-blue/80 hover:to-purple-400/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-black font-semibold transition-all duration-300"
                      whileHover={currentStep < steps.length - 1 ? { scale: 1.05, x: 5 } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{currentStep === steps.length - 1 ? 'Complete' : 'Next'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick Access Grid (Optional) */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {steps.map((step, index) => (
            <motion.button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                currentStep === index
                  ? `border-transparent bg-gradient-to-r ${step.gradient}`
                  : 'border-white/10 bg-black/20 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className={`flex items-center space-x-3 ${currentStep === index ? 'text-black' : 'text-white'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  currentStep === index ? 'bg-black/20' : `bg-gradient-to-r ${step.gradient}`
                }`}>
                  <span className={`text-sm font-bold ${currentStep === index ? 'text-black' : 'text-black'}`}>
                    {step.id}
                  </span>
                </div>
                <div>
                  <h6 className="font-semibold text-sm">{step.title}</h6>
                  <p className={`text-xs ${currentStep === index ? 'text-black/80' : 'text-gray-400'}`}>
                    {step.duration}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default QuickStartGuide;
