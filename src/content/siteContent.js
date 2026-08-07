// Site-wide copy and links. Sections read from content modules like this one;
// no user-facing copy lives inside components.

// Hoisted out of the object below for one reason: two entries are built from
// it, and an object literal cannot reference its own keys. The alternative is
// the listing URL written twice, one of which would eventually be the stale
// one. Same extension as MARKETPLACE_EXTENSION_ID in lib/marketplace.js, which
// sits at the bottom of the layering and may not import upward — all of them
// change together.
const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr';

export const site = {
  name: 'Code-XR',
  version: 'v1.2.0',
  tagline: 'Code analysis you can walk through',
  description:
    'Code-XR is a VS Code extension that analyzes your code and turns the metrics into a 3D scene: walk your codebase like a city, watch it update live, and replay its Git history.',
  links: {
    marketplace: MARKETPLACE_URL,
    // The listing's REVIEW TAB, byte-for-byte the link the extension README
    // hands out ("Enjoying CodeXR?"). `ssr=false` is not decoration and must
    // not be tidied away: the Marketplace answers a plain request with a
    // server-rendered listing that does nothing with the `#review-details`
    // fragment, so the reader lands at the top of the page and has to go
    // looking for the tab. Asking for the client-rendered variant is what
    // makes the fragment resolve.
    marketplaceReview: `${MARKETPLACE_URL}&ssr=false#review-details`,
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
