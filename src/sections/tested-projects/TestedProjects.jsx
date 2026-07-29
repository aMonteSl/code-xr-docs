import { useState } from 'react';
import { ChevronDown, Folder, FolderOpen } from 'lucide-react';
import Container from '@/components/ui/Container';
import { testedProjects } from '@/content/testedProjectsContent';
import ProjectPanel from '@/sections/tested-projects/ProjectPanel';

// The projects CodeXR has been run against, as the accordion the previous site
// used: one open at a time, clicking the open one closes it again.
//
// The panel is unmounted while closed, on purpose. Each dashboard export is
// ~1.7 MB with its own runtime and each project also carries a video, so
// mounting all three would cost more than the rest of the page put together.
const TestedProjects = () => {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <section id="tested-projects" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {testedProjects.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {testedProjects.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {testedProjects.intro}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {testedProjects.projects.map((project) => {
            const isOpen = openId === project.id;
            const FolderIcon = isOpen ? FolderOpen : Folder;

            return (
              <article
                key={project.id}
                className="overflow-hidden rounded-card border border-edge bg-surface-raised shadow-card"
              >
                <button
                  type="button"
                  onClick={() => toggle(project.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${project.id}-panel`}
                  aria-label={
                    isOpen
                      ? testedProjects.labels.collapse(project.title)
                      : testedProjects.labels.expand(project.title)
                  }
                  className="group flex w-full items-center gap-4 p-5 text-left transition-[background-color] duration-300 hover:bg-surface-sunken motion-reduce:transition-none sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface text-accent transition-[border-color] duration-300 group-hover:border-accent/40 motion-reduce:transition-none"
                  >
                    <FolderIcon className="size-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold tracking-tight text-ink sm:text-xl">
                      {project.title}
                    </span>
                    <span className="mt-1 block text-sm text-pretty text-ink-muted">
                      {project.summary}
                    </span>
                  </span>

                  <ChevronDown
                    aria-hidden="true"
                    className={`size-5 shrink-0 text-ink-muted transition-[color,transform] duration-300 group-hover:text-ink motion-reduce:transition-none ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen ? (
                  <div id={`${project.id}-panel`}>
                    <ProjectPanel project={project} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default TestedProjects;
