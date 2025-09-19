import React from 'react';
import { Download, FileText, Presentation, Award } from 'lucide-react';
import { getAssetPath } from '../utils/assets';

const Downloads = () => {
  const handlePosterDownload = () => {
    const url = getAssetPath('/documents/vissoft2025-poster.pdf');
    window.open(url, '_blank');
  };

  const handleTFGDownload = () => {
    const url = getAssetPath('/documents/tfg_Adrian_Montes_Linares.pdf');
    window.open(url, '_blank');
  };

  const handlePresentationDownload = () => {
    const url = getAssetPath('/documents/tfg-presentation.pdf');
    window.open(url, '_blank');
  };

  return (
    <section id="downloads" className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-400 opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Academic</span>{' '}
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Resources
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Access the complete academic documentation behind Code-XR, including the full thesis and presentation materials.
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Conference Poster Card */}
          <div
            className="glass-card-hover p-8 text-center flex flex-col h-full"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 min-h-[2.5rem] flex items-center justify-center">
              Conference Paper – VISSOFT 2025
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed text-sm flex-grow">
              Research work accepted at VISSOFT 2025, an IEEE conference on software visualization. Presents the core ideas and implementation of CodeXR.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <p className="text-yellow-400 text-xs font-medium">
                IEEE Conference Recognition
              </p>
            </div>
            <div className="mt-auto">
              <button
                onClick={handlePosterDownload}
                className="btn-primary inline-flex items-center space-x-2 w-full justify-center mb-3"
              >
                <Download className="w-5 h-5" />
                <span>Download Paper</span>
              </button>
              <p className="text-xs text-gray-500">PDF Document • IEEE VISSOFT 2025</p>
            </div>
          </div>

          {/* TFG Download Card */}
          <div
            className="glass-card-hover p-8 text-center flex flex-col h-full"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-neon-blue to-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 min-h-[2.5rem] flex items-center justify-center">
              Final Degree Project (TFG)
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed text-sm flex-grow">
              Complete thesis document detailing the research, development, and evaluation of Code-XR. Includes methodology and comprehensive analysis.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
              <p className="text-blue-400 text-xs font-medium">
                Academic Thesis Document
              </p>
            </div>
            <div className="mt-auto">
              <button
                onClick={handleTFGDownload}
                className="btn-primary inline-flex items-center space-x-2 w-full justify-center mb-3"
              >
                <Download className="w-5 h-5" />
                <span>Download TFG</span>
              </button>
              <p className="text-xs text-gray-500">PDF Document • Academic Research</p>
            </div>
          </div>

          {/* Presentation Download Card */}
          <div
            className="glass-card-hover p-8 text-center flex flex-col h-full"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Presentation className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 min-h-[2.5rem] flex items-center justify-center">
              Defense Presentation
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed text-sm flex-grow">
              Presentation slides used during the thesis defense. Includes key findings, demonstrations, and visual summaries of the project.
            </p>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6">
              <p className="text-purple-400 text-xs font-medium">
                Defense Presentation Materials
              </p>
            </div>
            <div className="mt-auto">
              <button
                onClick={handlePresentationDownload}
                className="btn-primary inline-flex items-center space-x-2 w-full justify-center mb-3"
              >
                <Download className="w-5 h-5" />
                <span>Download Presentation</span>
              </button>
              <p className="text-xs text-gray-500">PDF Slides • Defense Materials</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12" data-aos="fade-up" data-aos-delay="400">
          <div className="glass-card p-6 max-w-2xl mx-auto">
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className="text-neon-blue font-medium">Note:</span> These materials represent the academic foundation 
              of Code-XR and provide detailed insights into the research methodology, technical implementation, 
              and evaluation processes used in the development of this VS Code extension.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Downloads;
