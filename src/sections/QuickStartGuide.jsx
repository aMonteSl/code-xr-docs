import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Play,
  Search,
  Settings,
  Zap,
} from 'lucide-react';

const QuickStartGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepProgress, setStepProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps = useMemo(
    () => [
      {
        id: 1,
        title: 'Install and Configure',
        description: 'Get Code-XR ready in your VS Code environment',
        icon: Settings,
        gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
        details: [
          'Install Code-XR from the VS Code Marketplace with one click.',
          'Configure your preferred analysis settings from the extension UI.',
          'Review XR environment preferences, debounce behavior, and the Python environment status tools.',
        ],
        tip: 'Start with the default configuration and adjust the analysis mode only after your first successful run.',
        duration: '2 min',
      },
      {
        id: 2,
        title: 'Choose Your Analysis',
        description: 'Discover the file, directory, project, and DOM workflows available in Code-XR',
        icon: Play,
        gradient: 'from-blue-400 via-indigo-400 to-purple-400',
        details: [
          'Launch file analysis in LivePanel or XR mode from the Explorer, tree view, or command palette.',
          'Run directory and project analysis in shallow or deep mode depending on how much hierarchy you want to inspect.',
          'Use DOM visualization for HTML workflows and let the extension route the file into the correct scene automatically.',
        ],
        tip: 'Shallow analysis is usually the fastest entry point before moving into deeper recursive scans.',
        duration: '3 min',
      },
      {
        id: 3,
        title: 'Experiment in Real Time',
        description: 'Edit code while watching metrics and immersive scenes react to meaningful changes',
        icon: Zap,
        gradient: 'from-purple-400 via-pink-400 to-rose-400',
        details: [
          'Use the live watchers to observe how metrics evolve as the codebase changes.',
          'Refactor hotspots with high complexity or poor ratios and compare the result in LivePanel or XR.',
          'Tune debounce timing to match your editing rhythm and the size of the repository you are exploring.',
        ],
        tip: 'Shorter, focused functions make the visual differences much easier to interpret in both panels and immersive charts.',
        duration: '5 min',
      },
      {
        id: 4,
        title: 'Save for the Next Session',
        description: 'Keep your preferred configuration and return to a stable workflow quickly',
        icon: Search,
        gradient: 'from-orange-400 via-red-400 to-pink-400',
        details: [
          'Save your configuration from the analysis settings menu after you find a workflow that fits your project.',
          'Reopen VS Code later and continue with the same profile, preferred analysis mode, and environment setup.',
          'Use the built-in verification and reinitialization actions if the Python environment ever needs recovery.',
        ],
        tip: 'Treat the saved configuration as a baseline profile for future projects instead of reconfiguring from scratch.',
        duration: '1 min',
      },
    ],
    []
  );

  const nextStep = useCallback(() => {
    setCurrentStep((previous) => Math.min(previous + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  }, []);

  const goToStep = useCallback((index) => {
    setCurrentStep(index);
  }, []);

  const markComplete = useCallback((stepId) => {
    setCompletedSteps((previous) =>
      previous.includes(stepId) ? previous : [...previous, stepId]
    );
  }, []);

  const formatTime = useCallback((seconds) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}min - ${remainingSeconds}s`;
    }

    return `${seconds}s`;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('quick-start-guide');

    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const currentDuration = parseInt(steps[currentStep].duration, 10) * 60;
    setStepProgress(0);

    if (completedSteps.includes(steps[currentStep].id)) {
      setStepProgress(currentDuration);
      return undefined;
    }

    const progressInterval = setInterval(() => {
      setStepProgress((previous) => {
        const nextProgress = previous + 1;

        if (nextProgress >= currentDuration) {
          clearInterval(progressInterval);
          markComplete(steps[currentStep].id);
          return currentDuration;
        }

        return nextProgress;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [completedSteps, currentStep, isVisible, markComplete, steps]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextStep();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prevStep();
      } else if (event.key >= '1' && event.key <= String(steps.length)) {
        event.preventDefault();
        goToStep(parseInt(event.key, 10) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToStep, nextStep, prevStep, steps.length]);

  const currentStepData = steps[currentStep];
  const CurrentStepIcon = currentStepData.icon;
  const currentDurationSeconds = parseInt(currentStepData.duration, 10) * 60;

  return (
    <section
      id="quick-start-guide"
      className="relative overflow-hidden bg-transparent py-20"
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(0, 170, 255, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.03) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
            <span className="text-white">Quick Start</span>{' '}
            <span className="bg-gradient-to-r from-neon-blue via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Guide
            </span>
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
            Master Code-XR in four practical steps, from initial installation to a repeatable
            analysis workflow.
          </p>

          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 text-neon-blue" />
            <span className="text-gray-300">Total time: about 11 minutes</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <div key={currentStepData.id} className="animate-fade-in-up">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/90 to-black/90 shadow-2xl backdrop-blur-xl">
              <div className={`bg-gradient-to-r ${currentStepData.gradient} p-1`}>
                <div className="rounded-t-3xl bg-black/90 p-8">
                  <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r ${currentStepData.gradient} shadow-lg`}
                      >
                        <CurrentStepIcon className="h-8 w-8 text-black" />
                      </div>

                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3 text-gray-400">
                          <span className="text-lg font-medium">Step {currentStepData.id}</span>
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4" />
                            {currentStepData.duration}
                          </span>
                        </div>
                        <h3 className="mb-3 text-3xl font-bold text-white lg:text-4xl">
                          {currentStepData.title}
                        </h3>
                        <p className="max-w-2xl text-xl leading-relaxed text-gray-300">
                          {currentStepData.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      {completedSteps.includes(currentStepData.id) ? (
                        <>
                          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                            <CheckCircle className="h-8 w-8 text-white" />
                          </div>
                          <span className="text-sm font-medium text-green-400">Completed</span>
                        </>
                      ) : (
                        <>
                          <div className="relative mb-2 h-16 w-16">
                            <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 64 64">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="4"
                                fill="none"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="url(#guide-gradient)"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={`${
                                  2 * Math.PI * 28 * (1 - stepProgress / currentDurationSeconds)
                                }`}
                                className="transition-all duration-100 ease-out"
                              />
                              <defs>
                                <linearGradient id="guide-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#00AAFF" />
                                  <stop offset="100%" stopColor="#A855F7" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Clock className="h-6 w-6 text-neon-blue" />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-400">
                            {formatTime(Math.round(stepProgress))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8 p-8">
                <div className="space-y-6">
                  <h4 className="flex items-center text-2xl font-bold text-white">
                    <ArrowRight className="mr-3 h-6 w-6 text-neon-blue" />
                    What you will do
                  </h4>

                  <div className="space-y-4">
                    {currentStepData.details.map((detail, index) => (
                      <div
                        key={detail}
                        className="flex items-start space-x-4 rounded-xl p-4 transition-all duration-300 hover:bg-white/5"
                      >
                        <div
                          className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r ${currentStepData.gradient}`}
                        >
                          <span className="text-sm font-bold text-black">{index + 1}</span>
                        </div>
                        <p className="leading-relaxed text-gray-300">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-2xl bg-gradient-to-r ${currentStepData.gradient} p-1`}>
                  <div className="rounded-2xl bg-black/90 p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${currentStepData.gradient}`}
                      >
                        <Lightbulb className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h5 className="mb-2 text-lg font-bold text-white">Pro tip</h5>
                        <p className="leading-relaxed text-gray-300">{currentStepData.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/50 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="inline-flex items-center justify-center space-x-2 rounded-xl bg-white/10 px-6 py-3 text-white transition-all duration-300 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center justify-center gap-2">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`h-3 w-3 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? `bg-gradient-to-r ${currentStepData.gradient}`
                            : completedSteps.includes(step.id)
                            ? 'bg-green-500'
                            : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1}
                    className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-neon-blue to-purple-400 px-6 py-3 font-semibold text-black transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{currentStep === steps.length - 1 ? 'Complete' : 'Next'}</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-4"
          data-aos="fade-up"
          data-aos-delay="150"
        >
          {steps.map((step, index) => {
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
                className={`rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                  currentStep === index
                    ? `border-transparent bg-gradient-to-r ${step.gradient} text-black`
                    : 'border-white/10 bg-black/20 text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      currentStep === index ? 'bg-black/20' : `bg-gradient-to-r ${step.gradient}`
                    }`}
                  >
                    <StepIcon className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h6 className="text-sm font-semibold">{step.title}</h6>
                    <p className={`text-xs ${currentStep === index ? 'text-black/80' : 'text-gray-400'}`}>
                      {step.duration}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickStartGuide;
