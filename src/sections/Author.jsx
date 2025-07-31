import React from 'react';
import { Github, Linkedin, Mail, MapPin, GraduationCap, Code } from 'lucide-react';
import { getAssetPath } from '../utils/assets';

const Author = () => {
  return (
    <section id="author" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 170, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 170, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Meet the</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Author
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get to know the developer behind Code-XR and the vision that drives this innovative VS Code extension.
          </p>
        </div>

        {/* Author Card */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 lg:p-12" data-aos="fade-up" data-aos-delay="200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Profile Image */}
              <div className="lg:col-span-1 text-center lg:text-left">
                <div className="inline-block relative">
                  <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-neon-blue/20 to-purple-400/20 flex items-center justify-center mx-auto lg:mx-0 border-2 border-neon-blue/30 overflow-hidden p-1">
                    {/* Your Profile Photo */}
                    <picture>
                      <source 
                        media="(max-width: 640px)" 
                        srcSet={getAssetPath("/profile/adrian-montes-linares-small.jpg")}
                      />
                      <source 
                        media="(max-width: 1024px)" 
                        srcSet={getAssetPath("/profile/adrian-montes-linares-medium.jpg")}
                      />
                      <source 
                        media="(min-width: 1025px)" 
                        srcSet={getAssetPath("/profile/adrian-montes-linares-large.jpg")}
                      />
                      <img 
                        src={getAssetPath("/profile/adrian-montes-linares-medium.jpg")}
                        alt="Adrián Montes Linares"
                        className="w-full h-full rounded-full object-cover shadow-2xl"
                        style={{
                          objectPosition: 'center center',
                          filter: 'brightness(1.05) contrast(1.02) saturate(1.05)'
                        }}
                        width="512"
                        height="512"
                        loading="eager"
                        onError={(e) => {
                          // Fallback to placeholder if image doesn't load
                          e.target.style.display = 'none';
                          e.target.parentNode.nextSibling.style.display = 'flex';
                        }}
                      />
                    </picture>
                    {/* Fallback placeholder */}
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hidden items-center justify-center">
                      <div className="text-6xl text-neon-blue opacity-60">👨‍💻</div>
                    </div>
                  </div>
                  {/* Enhanced decorative rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-neon-blue/30 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full border border-purple-400/20"></div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-blue/10 to-purple-400/10 blur-lg -z-10"></div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Adrián Montes Linares
                </h3>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                  <span className="flex items-center space-x-2 px-3 py-1 bg-neon-blue/10 border border-neon-blue/30 rounded-full text-neon-blue text-sm">
                    <GraduationCap size={16} />
                    <span>Telecommunications Engineering Student</span>
                  </span>
                  <span className="flex items-center space-x-2 px-3 py-1 bg-purple-400/10 border border-purple-400/30 rounded-full text-purple-400 text-sm">
                    <Code size={16} />
                    <span>First XR Experience</span>
                  </span>
                  <span className="flex items-center space-x-2 px-3 py-1 bg-green-400/10 border border-green-400/30 rounded-full text-green-400 text-sm">
                    <MapPin size={16} />
                    <span>Spain</span>
                  </span>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Telecommunications Engineering student with great motivation to learn and apply knowledge in real environments. 
                  Code-XR represents my Final Degree Project (TFG), marking my first experience with XR technologies and 
                  demonstrating how traditional code development can be enhanced through immersive 3D visualization.
                </p>

                <p className="text-gray-300 leading-relaxed mb-8">
                  With a problem-solving and analytical profile, I have a talent for finding creative solutions. 
                  I'm committed to quality, meticulous with details, and accustomed to delivering well-polished projects, 
                  both in individual and team work. This project bridges my telecommunications background with cutting-edge 
                  XR technology, creating an innovative VS Code extension that transforms how developers interact with their code.
                </p>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <a
                    href="https://github.com/aMonteSl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-all duration-300 hover:scale-105"
                  >
                    <Github size={18} />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/adrianmonteslinares/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all duration-300 hover:scale-105"
                  >
                    <Linkedin size={18} />
                    <span>LinkedIn</span>
                  </a>
                  <a
                    href="mailto:adrian.adyra@gmail.com"
                    className="flex items-center space-x-2 px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 rounded-lg text-black font-medium transition-all duration-300 hover:scale-105"
                  >
                    <Mail size={18} />
                    <span>Contact</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up" data-aos-delay="400">
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Education</h4>
              <p className="text-gray-300 text-sm">
                Telecommunications Engineering student with focus on communications and emerging technologies
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">TFG Project</h4>
              <p className="text-gray-300 text-sm">
                Code-XR as Final Degree Project, exploring XR technologies for software visualization
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Approach</h4>
              <p className="text-gray-300 text-sm">
                Creative problem-solving with attention to detail and commitment to delivering polished projects
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Author;
