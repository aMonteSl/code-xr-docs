// Tested projects: mature open source repositories CodeXR has been run
// against, each with its demo video and its real dashboard export.
//
// TO CHANGE OR ADD A PROJECT, everything lives in `projects` below:
//   id              also the folder name under public/dashboards/<id>/ — the
//                   prebuild step (scripts/sync-dashboards.mjs) reads THIS
//                   file, so a new id here creates dashboard-imports/<id>/ on
//                   the next build, waiting for exactly one export folder
//                   containing index.html
//   title           the accordion header
//   summary         one line, visible while collapsed
//   body            the paragraph shown once open
//   subtitle        the line that introduces the media
//   youtubeId       the demo video
//   repositoryUrl   where the code lives
//   dashboardPreview  false to skip the embedded dashboard for this project
//
// Order here is the order on the page. Nothing else needs touching: the
// section renders whatever this array contains.
export const testedProjects = {
  eyebrow: 'Tested projects',
  heading: 'Run against real codebases',
  intro:
    'CodeXR has been exercised on mature open source repositories to check it holds up across different architectures, languages and sizes. Open any project to see the demo and the dashboard its analysis produced.',

  labels: {
    expand: (title) => `Show the analysis of ${title}`,
    collapse: (title) => `Hide the analysis of ${title}`,
    videoTitle: (title) => `CodeXR analysing ${title}`,
    playVideo: (title) => `Play the analysis of ${title}`,
    watchOnYouTube: 'Watch the full analysis',
    repository: 'View the repository',
    videoBlockTitle: 'Analysis demo video',
    videoBlockBody: (title) => `Watch CodeXR analyse ${title} in real time.`,
    dashboardTitle: 'Interactive dashboard',
    dashboardBody:
      'The real Code-XR export for this project, embedded with its own runtime and assets. It is live: pan, zoom and click inside it.',
    dashboardOpen: 'Open full view',
    dashboardLoading: 'Loading the dashboard export',
    dashboardInteract: 'Tap to explore in 3D',
    dashboardLabel: (title) => `Interactive Code-XR dashboard for ${title}`,
    dashboardOpenLabel: (title) => `Open the full Code-XR dashboard for ${title} in a new tab`,
  },

  projects: [
    {
      id: 'babia-xr',
      title: 'Babia-XR',
      summary:
        'An extended reality platform for immersive education and training, used here as a mature XR architecture reference.',
      body: 'Babia-XR combines virtual, augmented and mixed reality to create interactive learning environments. CodeXR was used on it to inspect how a modular XR architecture can be navigated and understood through visual analysis.',
      subtitle: 'A video demo and an interactive dashboard for this educational XR platform.',
      youtubeId: 'ZJo2eFBEPKA',
      repositoryUrl: 'https://gitlab.com/babiaxr/aframe-babia-components',
      dashboardPreview: true,
    },
    {
      id: 'express',
      title: 'Express.js',
      summary:
        'A minimal and flexible Node.js framework, useful to validate middleware-heavy server architectures.',
      body: 'Express.js is a mature backend framework whose routing, middleware and server-side logic make it a strong candidate for validating structural and metric-based analysis.',
      subtitle:
        'How CodeXR maps server-side architecture and middleware chains in a widely used production framework.',
      youtubeId: 'ExHQhj6ibWU',
      repositoryUrl: 'https://github.com/expressjs/express',
      dashboardPreview: true,
    },
    {
      id: 'jetuml',
      title: 'JetUML',
      summary:
        'A Java desktop application used to demonstrate object-oriented and legacy codebase exploration.',
      body: 'JetUML is a lightweight UML tool that shows how CodeXR handles mature Java applications and object-oriented project structures.',
      subtitle: 'How CodeXR reveals architectural patterns in a long-lived desktop codebase.',
      youtubeId: 'Wy0T7dR2F-k',
      repositoryUrl: 'https://github.com/prmr/JetUML',
      dashboardPreview: true,
    },
  ],
};
