import React, { useState } from 'react';
import { ExternalLink, Folder, FolderOpen, Play } from 'lucide-react';
import DashboardPreview from '../components/DashboardPreview';
import { testedProjects } from '../content/testedProjectsContent';
import { getAssetPath } from '../utils/assets';

const RealProjects = () => {
  const [openProject, setOpenProject] = useState(null);

  const toggleProject = (projectId) => {
    setOpenProject((previous) => (previous === projectId ? null : projectId));
  };

  return (
    <section id="tested-projects" className="relative overflow-hidden bg-transparent py-20">
      <div className="absolute inset-0">
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-neon-blue/5 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 h-96 w-96 rounded-full bg-purple-400/5 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            <span className="text-white">Tested on</span>{' '}
            <span className="bg-linear-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Large-Scale Projects
            </span>
          </h2>
          <p className="mx-auto mb-8 max-w-4xl text-xl text-gray-300">
            Code-XR has been exercised on mature open source repositories to validate the plugin on
            different architectures, languages, and codebase sizes.
          </p>
          <p className="mx-auto max-w-3xl text-lg text-gray-400">
            Open any project below to inspect the demo video and the interactive dashboard preview.
          </p>
        </div>

        <div className="space-y-6">
          {testedProjects.map((project, index) => (
            <article
              key={project.id}
              className="glass-card-hover overflow-hidden"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between p-6 text-left transition-colors duration-300 hover:bg-white/5"
                onClick={() => toggleProject(project.id)}
                aria-expanded={openProject === project.id}
                aria-controls={`${project.id}-details`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-r ${project.color} transition-transform duration-300 ${
                      openProject === project.id ? 'scale-110' : ''
                    }`}
                  >
                    {openProject === project.id ? (
                      <FolderOpen className="h-6 w-6 text-white" />
                    ) : (
                      <Folder className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-2xl font-bold text-white">{project.title}</h3>
                    <p className="text-gray-300">{project.description}</p>
                  </div>
                </div>

                <svg
                  className={`h-6 w-6 text-neon-blue transition-transform duration-300 ${
                    openProject === project.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openProject === project.id && (
                <div
                  id={`${project.id}-details`}
                  className="animate-fade-in-up border-t border-white/10"
                >
                  <div className="space-y-6 p-6">
                    <div className="space-y-4">
                      <p className="text-lg leading-relaxed text-gray-300">
                        {project.content.description}
                      </p>
                      <p className="text-base font-medium text-neon-blue">
                        {project.content.subtitle}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/50">
                      <div className="aspect-video">
                        <iframe
                          className="h-full w-full"
                          src={`https://www.youtube.com/embed/${project.content.youtubeId}`}
                          title={`${project.title} Code-XR analysis demo video`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                      <div className="border-t border-white/10 p-4">
                        <h4 className="mb-1 text-white">Analysis Demo Video</h4>
                        <p className="text-sm text-gray-400">
                          Watch Code-XR analyze {project.title} in real time.
                        </p>
                      </div>
                    </div>

                    {project.content.dashboardPreview && (
                      <DashboardPreview
                        title={project.title}
                        url={getAssetPath(`dashboards/${project.id}/index.html`)}
                      />
                    )}

                    <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row">
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center justify-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Project Repository</span>
                      </a>
                      <a
                        href={`https://www.youtube.com/watch?v=${project.content.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Play className="h-4 w-4" />
                        <span>Watch Full Analysis</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RealProjects;
