export const latestRelease = {
  version: 'v1.1.0',
  publishedAt: '2026-03-22T00:00:00.000Z',
  headline: "What's new in v1.1.0",
  summary:
    'Code-XR v1.1.0 makes the VS Code extension faster, more stable, and much more collaborative. The release modernizes the static analysis pipeline, introduces shared virtual screens, and brings safer chart remapping directly into the immersive scene.',
  highlights: [
    {
      id: 'performance',
      icon: 'zap',
      eyebrow: 'Performance',
      title: '18x faster analysis pipeline',
      description:
        'In the benchmark shown below, the same XR analysis drops from roughly 54 seconds in v1.0.0 to around 3 seconds in v1.1.0 thanks to the unified incremental watchers and shared inventory pipeline.',
      stat: '18x faster',
    },
    {
      id: 'collaboration',
      icon: 'users',
      eyebrow: 'Collaboration',
      title: 'Shared XR and DOM rooms',
      description:
        'Connected users can now see presence markers, shared chart refreshes, mapping changes, and synchronized layout updates inside the same live room.',
      stat: 'Live rooms',
    },
    {
      id: 'virtual-screens',
      icon: 'monitor',
      eyebrow: 'Immersive workflow',
      title: 'Virtual screens with video and audio',
      description:
        'Project a desktop, window, or browser tab into the scene and keep the selected media synchronized across connected devices in real time.',
      stat: 'Video + audio',
    },
    {
      id: 'mapping-ui',
      icon: 'sliders',
      eyebrow: 'Stability',
      title: 'In-scene Mapping UI with safe recovery',
      description:
        'Remap chart dimensions from inside XR, validate the new geometry, and automatically roll back to the last stable mapping if the rebuild fails.',
      stat: 'Safer remaps',
    },
  ],
  comparisonMedia: [
    {
      id: 'scene-comparison',
      type: 'comparison',
      title: 'Visual scene redesign',
      description:
        'The immersive room in v1.1.0 replaces the previous minimal stage with custom assets, textures, and a more production-ready presentation.',
      before: {
        label: 'v1.0.0',
        imagePath: '/assets/releases/v1-1-0/scene-v1.0.0.png',
      },
      after: {
        label: 'v1.1.0',
        imagePath: '/assets/releases/v1-1-0/scene-v1.1.0.png',
      },
    },
    {
      id: 'virtual-screen-controller',
      type: 'image',
      title: 'Shared virtual screen runtime',
      description: 'Control shared screens directly inside XR with synchronized layout actions.',
      imagePath: '/assets/releases/v1-1-0/virtual-screen-controller.png',
      mediaLabel: 'Feature screenshot',
    },
    {
      id: 'pedestal-mapping',
      type: 'image',
      title: 'Pedestal layout and Mapping UI',
      description: 'Stabilize the chart pedestal and remap dimensions from inside the scene.',
      imagePath: '/assets/releases/v1-1-0/pedestal-mapping-ui.png',
      mediaLabel: 'Feature screenshot',
    },
    {
      id: 'collaborative-workspace',
      type: 'image',
      title: 'Collaborative workspace',
      description: 'Shared presence markers and synchronized interactions make live rooms legible.',
      imagePath: '/assets/releases/v1-1-0/collaborative-workspace.png',
      mediaLabel: 'Feature screenshot',
    },
  ],
  performanceComparison: {
    id: 'performance-comparison',
    type: 'comparison',
    title: 'Optimized analysis pipeline benchmark',
    mediaLabel: 'Same-analysis benchmark',
    description:
      'These GIFs compare the same XR analysis running in v1.0.0 and v1.1.0. In this benchmark, startup falls from roughly 54 seconds to 3 seconds, which translates into 18x faster startup and 94.4% less waiting time.',
    comparisonRows: [
      {
        id: 'analysis-startup',
        metric: 'Same-analysis startup',
        before: '54s',
        after: '3s',
        improvement: '-94.4% wait',
      },
      {
        id: 'relative-speed',
        metric: 'Relative speed',
        before: '1x baseline',
        after: '18x',
        improvement: '18x faster',
      },
    ],
    before: {
      label: 'v1.0.0',
      stat: '54s benchmark',
      imagePath: '/assets/releases/v1-1-0/performance-v1.0.0.gif',
    },
    after: {
      label: 'v1.1.0',
      stat: '3s benchmark',
      imagePath: '/assets/releases/v1-1-0/performance-v1.1.0.gif',
    },
  },
  latestVideos: [
    {
      id: 'latest-file-workflow',
      type: 'video',
      category: 'Latest Release',
      title: 'New File XR Analysis Workflow',
      description:
        'Explore the updated v1.1.0 XR workflow for single-file analysis and the new scene runtime.',
      videoUrl: 'https://youtu.be/j8dgZtmjNks',
      mediaLabel: 'Release video',
    },
    {
      id: 'latest-directory-workflow',
      type: 'video',
      category: 'Latest Release',
      title: 'New Directory and Project XR Workflow',
      description:
        'Walk through the renewed project and directory XR workflow built on the unified analysis pipeline.',
      videoUrl: 'https://youtu.be/m6FHpENUvtU',
      mediaLabel: 'Release video',
    },
  ],
  copyBlocks: {
    heroBadge: 'Now live: v1.1.0',
    heroPrimaryCta: 'Install Extension',
    heroSecondaryCta: "See What's New",
    heroDescriptions: [
      'Code-XR is a VS Code extension for static code analysis and immersive XR software visualization.',
      'Explore files, directories, and full projects inside a faster and more stable XR workspace.',
      'Project screens into shared XR rooms and inspect richer software metrics in real time.',
      'Bring safer mapping controls and collaborative visualization directly into your VS Code workflow.',
    ],
    featuresIntro:
      'Code-XR v1.1.0 strengthens the core product pillars: faster analysis, richer metrics, immersive collaboration, and a smoother Python-backed setup.',
    installIntro:
      'Install Code-XR from the Marketplace, CLI, or VSIX workflow and start from the latest release-ready setup path.',
    installNote:
      'The extension now manages HTTPS certificate generation and Python environment recovery more cleanly inside VS Code.',
  },
};

export const galleryCategoryOrder = [
  'Latest Release',
  'Core Tutorials',
  'File Analysis',
  'Directory and Project Analysis',
  'Special Features',
  'AR and XR Experiences',
];

export const galleryMedia = [
  ...latestRelease.latestVideos,
  {
    id: 'latest-scene-upgrade',
    type: 'image',
    category: 'Latest Release',
    title: 'Immersive Room Scene Upgrade',
    description:
      'The visual language of the XR scene now feels like a dedicated room instead of a minimal stage.',
    imagePath: '/assets/releases/v1-1-0/scene-v1.1.0.png',
    mediaLabel: 'Release screenshot',
  },
  {
    id: 'latest-performance',
    type: 'image',
    category: 'Latest Release',
    title: 'Release Performance Snapshot',
    description:
      'A same-analysis benchmark clip that highlights the faster v1.1.0 startup path.',
    imagePath: '/assets/releases/v1-1-0/performance-v1.1.0.gif',
    mediaLabel: 'Release clip',
  },
  {
    id: 'latest-virtual-screen',
    type: 'image',
    category: 'Latest Release',
    title: 'Virtual Screen Controller',
    description:
      'Manage shared screen surfaces directly from the immersive scene with synchronized layout actions.',
    imagePath: '/assets/releases/v1-1-0/virtual-screen-controller.png',
    mediaLabel: 'Release screenshot',
  },
  {
    id: 'latest-mapping-ui',
    type: 'image',
    category: 'Latest Release',
    title: 'Pedestal and Mapping UI',
    description:
      'The pedestal layout and remapping panel stabilize charts and make data remapping easier inside XR.',
    imagePath: '/assets/releases/v1-1-0/pedestal-mapping-ui.png',
    mediaLabel: 'Release screenshot',
  },
  {
    id: 'latest-collaborative-room',
    type: 'image',
    category: 'Latest Release',
    title: 'Collaborative Workspace',
    description:
      'Presence markers and synchronized interactions make live XR and DOM sessions much more legible.',
    imagePath: '/assets/releases/v1-1-0/collaborative-workspace.png',
    mediaLabel: 'Release screenshot',
  },
  {
    id: 'core-ui-tutorial',
    type: 'video',
    category: 'Core Tutorials',
    title: 'Complete UI Tutorial',
    description:
      'Complete walkthrough of the Code-XR interface and the core workflows across the extension.',
    videoUrl: 'https://youtu.be/KRgLdLZJXHA',
    mediaLabel: 'Tutorial video',
  },
  {
    id: 'file-livepanel',
    type: 'video',
    category: 'File Analysis',
    title: 'File Analysis in LivePanel',
    description:
      'Analyze individual files in the LivePanel mode with detailed metrics and quick drill-down workflows.',
    videoUrl: 'https://youtu.be/n5ZcjlR4pPc',
    mediaLabel: 'Workflow video',
  },
  {
    id: 'file-xr',
    type: 'video',
    category: 'File Analysis',
    title: 'File Analysis in XR',
    description:
      'Navigate a single-file immersive XR analysis and inspect code metrics in a 3D scene.',
    videoUrl: 'https://youtu.be/38jGwFGORvc',
    mediaLabel: 'Workflow video',
  },
  {
    id: 'directory-livepanel',
    type: 'video',
    category: 'Directory and Project Analysis',
    title: 'Directory Analysis in LivePanel',
    description:
      'Inspect directory-wide metrics and summaries in the standard LivePanel workflow.',
    videoUrl: 'https://youtu.be/sPWjcgV-gZQ',
    mediaLabel: 'Workflow video',
  },
  {
    id: 'directory-xr',
    type: 'video',
    category: 'Directory and Project Analysis',
    title: 'Directory Analysis in XR',
    description:
      'Navigate directories in the immersive XR scene and inspect structural patterns visually.',
    videoUrl: 'https://youtu.be/TnfS2SevtWU',
    mediaLabel: 'Workflow video',
  },
  {
    id: 'project-analysis',
    type: 'video',
    category: 'Directory and Project Analysis',
    title: 'Full Project Analysis',
    description:
      'Explore a full project analysis workflow that combines the broader LivePanel and XR perspectives.',
    videoUrl: 'https://youtu.be/NluAHe3BQu8',
    mediaLabel: 'Workflow video',
  },
  {
    id: 'dom-visualization',
    type: 'video',
    category: 'Special Features',
    title: 'HTML DOM Visualization',
    description:
      'Visualize HTML structures with the DOM analysis workflow and inspect hierarchical element data.',
    videoUrl: 'https://youtu.be/110b-AergdU',
    mediaLabel: 'Feature video',
  },
  {
    id: 'ar-experience',
    type: 'video',
    category: 'AR and XR Experiences',
    title: 'Augmented Reality Experience',
    description:
      'Experience Code-XR in augmented reality mode and see how the project extends beyond the desktop.',
    videoUrl: 'https://youtu.be/d7fojpP90Dk',
    mediaLabel: 'Experience video',
  },
];
