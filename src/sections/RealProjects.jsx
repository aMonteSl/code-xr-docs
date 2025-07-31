import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, Play, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { getAssetPath } from '../utils/assets';

const RealProjects = () => {
  const [openProject, setOpenProject] = useState(null);

  const projects = [
    {
      id: 'babia-xr',
      title: 'Babia-XR',
      description: 'An extended reality (XR) platform for immersive education and training - tested for educational content architecture analysis.',
      color: 'from-purple-400 to-pink-400',
      repositoryUrl: 'https://gitlab.com/babiaxr/aframe-babia-components',
      content: {
        description: 'Babia-XR is an extended reality (XR) platform focused on immersive education and training. It combines virtual, augmented, and mixed reality to create engaging, interactive environments for learning and professional development. We tested Code-XR\'s analysis capabilities on this educational platform to explore how its modular XR architecture and training components could be visualized and understood.',
        subtitle: 'Below is a video demo showcasing the analysis result of this innovative educational XR platform.',
        youtubeId: 'taoigIRu1ew',
        dashboardPreview: true,
        dashboardUrl: '/dashboards/babia-xr/index.html'
      }
    },
    {
      id: 'express',
      title: 'Express.js',
      description: 'A minimal and flexible Node.js web application framework for building scalable web and API servers.',
      color: 'from-green-400 to-blue-400',
      repositoryUrl: 'https://github.com/expressjs/express',
      content: {
        description: 'Express.js is a minimal and flexible Node.js web application framework that provides robust features for building web and API servers. It simplifies routing, middleware integration, and server-side logic, making it ideal for scalable backend development. We tested Code-XR on this mature framework to validate our plugin\'s ability to analyze complex middleware patterns, routing architectures, and server-side logic flow.',
        subtitle: 'Explore how Code-XR maps Express.js server-side architecture and middleware chains.',
        youtubeId: 'S1D8IEiqTyk',
        dashboardPreview: true,
        dashboardUrl: '/dashboards/express/index.html'
      }
    },
    {
      id: 'jetuml',
      title: 'JetUML',
      description: 'A desktop application for fast UML diagram creation - tested for legacy code analysis.',
      color: 'from-yellow-400 to-orange-400',
      repositoryUrl: 'https://github.com/prmr/JetUML',
      content: {
        description: 'JetUML is a lightweight tool for creating UML diagrams quickly. We tested Code-XR on this Java-based desktop application to demonstrate our plugin\'s effectiveness in analyzing object-oriented architectures and legacy codebases.',
        subtitle: 'See how Code-XR reveals architectural patterns in mature Java applications.',
        youtubeId: 'd2fzgzSVQRs',
        dashboardPreview: true,
        dashboardUrl: '/dashboards/jetuml/index.html'
      }
    }
  ];

  const toggleProject = (projectId) => {
    setOpenProject(openProject === projectId ? null : projectId);
  };

  return (
    <section id="tested-projects" className="py-20 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-400 opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Tested on</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Large-Scale Projects
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
            Code-XR has been tested on a variety of mature and large-scale open source projects to ensure its robustness, flexibility, and compatibility across architectures and technologies.
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Below you can explore how the plugin analyzes real-world codebases.
          </p>
        </div>

        {/* Project Folders */}
        <div className="space-y-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="glass-card-hover overflow-hidden"
              data-aos="fade-up"
              data-aos-delay={index * 100}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Folder Header */}
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors duration-300"
                onClick={() => toggleProject(project.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${project.color} flex items-center justify-center text-2xl transition-transform duration-300 ${
                    openProject === project.id ? 'scale-110' : ''
                  }`}>
                    {openProject === project.id ? (
                      <FolderOpen className="w-6 h-6 text-white" />
                    ) : (
                      <Folder className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {project.title}
                    </h3>
                    <p className="text-gray-300">{project.description}</p>
                  </div>
                </div>
                
                <motion.div
                  animate={{ rotate: openProject === project.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-neon-blue"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>

              {/* Folder Content */}
              <AnimatePresence>
                {openProject === project.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="border-t border-white/10"
                  >
                    <div className="p-6 space-y-6">
                      {/* Project Description */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="prose prose-invert max-w-none"
                      >
                        <p className="text-gray-300 text-lg leading-relaxed mb-4">
                          {project.content.description}
                        </p>
                        <p className="text-neon-blue text-base font-medium">
                          {project.content.subtitle}
                        </p>
                      </motion.div>

                      {/* YouTube Video Embed */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-black/50 rounded-lg border border-white/10 overflow-hidden"
                      >
                        <div className="aspect-video">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${project.content.youtubeId}`}
                            title={`${project.title} Analysis Demo`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="p-4 border-t border-white/10">
                          <h4 className="text-white font-medium mb-1">Analysis Demo Video</h4>
                          <p className="text-gray-400 text-sm">Watch Code-XR analyze {project.title} in real-time</p>
                        </div>
                      </motion.div>

                      {/* Interactive Dashboard Preview */}
                      {project.content.dashboardPreview && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="bg-black/50 rounded-lg border border-white/10 overflow-hidden"
                        >
                          <div className="p-4 border-b border-white/10">
                            <h4 className="text-white font-bold text-xl mb-2">Interactive Dashboard Preview</h4>
                            <p className="text-gray-300 text-sm">
                              {project.content.dashboardUrl 
                                ? 'Live interactive analysis dashboard powered by Code-XR'
                                : 'Interactive dashboard coming soon'
                              }
                            </p>
                          </div>
                          
                          {project.content.dashboardUrl ? (
                            <div className="relative">
                              <div className="aspect-video md:aspect-[4/3]">
                                <iframe
                                  src={getAssetPath(project.content.dashboardUrl)}
                                  className="w-full h-full border-0"
                                  title={`${project.title} Interactive Dashboard`}
                                  allow="fullscreen"
                                  loading="lazy"
                                />
                              </div>
                              <div className="absolute top-2 right-2">
                                <a
                                  href={getAssetPath(project.content.dashboardUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-black/70 hover:bg-neon-blue/20 text-white p-2 rounded-lg backdrop-blur-sm transition-colors duration-300 flex items-center space-x-1 text-xs"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open Full View</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8">
                              <div className="bg-gradient-to-br from-neon-blue/10 to-purple-400/10 rounded-lg border-2 border-dashed border-neon-blue/30 p-12 min-h-[200px] flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-neon-blue/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <p className="text-gray-300 font-medium mb-2">Interactive Dashboard</p>
                                  <p className="text-gray-400 text-sm">
                                    (Dashboard coming soon)
                                  </p>
                                  <p className="text-neon-blue text-xs mt-2">
                                    Live metrics and visualizations will be embedded here
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Call to Action */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10"
                      >
                        <a 
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex items-center space-x-2 justify-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View Project Repository</span>
                        </a>
                        <a 
                          href={`https://www.youtube.com/watch?v=${project.content.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center space-x-2 justify-center"
                        >
                          <Play className="w-4 h-4" />
                          <span>Watch Full Analysis</span>
                        </a>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RealProjects;
