// Site-wide copy and links. Sections read from content modules like this one;
// no user-facing copy lives inside components.
export const site = {
  name: 'Code-XR',
  version: 'v1.2.0',
  tagline: 'Code analysis you can walk through',
  description:
    'Code-XR is a VS Code extension that analyzes your code and turns the metrics into a 3D scene: walk your codebase like a city, watch it update live, and replay its Git history.',
  links: {
    // Same extension as MARKETPLACE_EXTENSION_ID in lib/marketplace.js (which
    // cannot import from this layer). The two change together.
    marketplace: 'https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr',
    github: 'https://github.com/aMonteSl/CodeXR',
    issues: 'https://github.com/aMonteSl/CodeXR/issues',
    docsRepo: 'https://github.com/aMonteSl/code-xr-docs',
    author: 'https://adrianmonteslinares.com/',
    // The author's own accounts, distinct from the project's: `github` above
    // is the CodeXR repository, this one is the person.
    authorGithub: 'https://github.com/aMonteSl',
    authorLinkedin: 'https://www.linkedin.com/in/adrianmonteslinares/',
    authorEmail: 'mailto:adrian.adyra@gmail.com',
    support: 'https://buymeacoffee.com/adrianadyrx',
    // The only INTERNAL entry here, and FloatingActions tells them apart by the
    // href itself rather than by a flag in fabContent.
    tutorial: '/tutorial/',
  },
  a11y: {
    skipToContent: 'Skip to content',
  },
};
