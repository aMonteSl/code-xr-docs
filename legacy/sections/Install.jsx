import React, { useState } from 'react';
import { Download, Copy, Check, Terminal, Package, ExternalLink, ShieldCheck } from 'lucide-react';
import { latestRelease } from '../content/releaseContent';

const Install = () => {
  const [copiedCommand, setCopiedCommand] = useState('');

  const installMethods = [
    {
      title: 'VS Code Marketplace',
      description: 'Open the official Marketplace listing and install the latest public version of Code-XR.',
      icon: Package,
      primary: true,
      steps: [
        'Open VS Code',
        'Go to Extensions (Ctrl+Shift+X)',
        'Search for "Code-XR"',
        'Click Install'
      ],
      cta: {
        text: 'Open in Marketplace',
        url: 'https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr'
      }
    },
    {
      title: 'Command Line',
      description: 'Use the VS Code CLI to install the extension directly from the public Marketplace.',
      icon: Terminal,
      command: 'code --install-extension aMonteSl.code-xr',
      steps: [
        'Open terminal',
        'Run the command',
        'Restart VS Code',
        'Extension ready to use'
      ]
    },
    {
      title: 'Manual Installation',
      description: 'Download the VSIX from GitHub releases when you need an offline or manual installation path.',
      icon: Download,
      steps: [
        'Download .vsix file from releases',
        'Open VS Code',
        'Extensions → Install from VSIX',
        'Select downloaded file'
      ],
      cta: {
        text: 'Download VSIX',
        url: 'https://github.com/aMonteSl/CodeXR/releases'
      }
    }
  ];

  const copyToClipboard = async (text, commandId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(commandId);
      setTimeout(() => setCopiedCommand(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const requirements = [
    {
      category: 'VS Code',
      items: ['Visual Studio Code 1.98.0 or newer', 'Windows, macOS, or Linux']
    },
    {
      category: 'Automatic Setup',
      items: [
        'Code-XR creates and maintains its Python environment inside VS Code storage when needed',
        'HTTPS certificates are generated locally on first startup for WebXR-compatible workflows'
      ]
    },
    {
      category: 'Optional for Immersive Workflows',
      items: [
        'A modern browser with WebXR support for external immersive scenes',
        'VR or AR hardware improves the experience but is not required for the desktop workflows'
      ]
    }
  ];

  return (
    <section id="install" className="relative overflow-hidden bg-transparent py-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-green-400 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-neon-blue opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Quick</span>{' '}
            <span className="text-gradient bg-linear-to-r from-neon-blue to-green-400 bg-clip-text text-transparent">
              Installation
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {latestRelease.copyBlocks.installIntro}
          </p>
        </div>

        {/* Installation Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {installMethods.map((method, index) => (
            <div
              key={index}
              className={`glass-card-hover p-8 relative overflow-hidden group ${
                method.primary ? 'ring-2 ring-neon-blue' : ''
              }`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {method.primary && (
                <div className="absolute top-0 right-0 bg-neon-blue text-black px-3 py-1 text-sm font-bold">
                  RECOMMENDED
                </div>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 rounded-xl ${
                method.primary 
                  ? 'bg-linear-to-r from-neon-blue to-blue-400' 
                  : 'bg-linear-to-r from-gray-600 to-gray-700'
              } flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-blue-hover`}>
                <method.icon size={32} className="text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon-blue transition-colors duration-300">
                {method.title}
              </h3>
              <p className="text-gray-300 mb-6">
                {method.description}
              </p>

              {/* Command */}
              {method.command && (
                <div className="bg-black/50 rounded-lg p-4 mb-6 border border-white/10">
                  <div className="flex items-center justify-between">
                    <code className="text-neon-blue text-sm font-mono">{method.command}</code>
                    <button
                      onClick={() => copyToClipboard(method.command, `cmd-${index}`)}
                      className="ml-2 text-gray-400 hover:text-neon-blue transition-colors"
                      title="Copy command"
                    >
                      {copiedCommand === `cmd-${index}` ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-2 mb-6">
                {method.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue text-xs flex items-center justify-center font-bold">
                      {stepIndex + 1}
                    </div>
                    <span className="text-gray-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {method.cta && (
                <a
                  href={method.cta.url}
                  target={method.cta.url.startsWith('http') ? '_blank' : undefined}
                  rel={method.cta.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    method.primary
                      ? 'bg-neon-blue text-black hover:bg-neon-blue-dark glow-blue'
                      : 'border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black'
                  }`}
                >
                  <span>{method.cta.text}</span>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="mb-16" data-aos="fade-up" data-aos-delay="400">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">System Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {requirements.map((req, index) => (
              <div key={index} className="glass-card p-6">
                <h4 className="text-lg font-bold text-neon-blue mb-4">{req.category}</h4>
                <ul className="space-y-2">
                  {req.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-300 text-sm flex items-start space-x-2">
                      <span className="text-neon-blue mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16" data-aos="fade-up" data-aos-delay="500">
          <div className="glass-card p-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-neon-blue/15 flex items-center justify-center text-neon-blue shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">v1.1.0 setup improvements</h3>
                <p className="text-gray-300 leading-relaxed">
                  {latestRelease.copyBlocks.installNote} The extension now exposes Python
                  environment status, verification, and reinitialization actions directly from the
                  UI when recovery is needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mt-16" data-aos="fade-up" data-aos-delay="800">
          <p className="text-gray-300 mb-6">
            For more information and detailed documentation, visit the extension page
          </p>
          <a
            href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center space-x-2 justify-center inline-flex"
          >
            <span>View on Marketplace</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Install;
