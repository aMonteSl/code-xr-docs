// All hero copy. Nothing user-facing may be inlined in the section's JSX.
export const hero = {
  title: {
    // The brand is the <h1>, split so "XR" can carry the accent colour —
    // echoing the mark, where the X and the R are separate paths.
    brandLead: 'Code-',
    brandAccent: 'XR',
    // Subtitle under the brand: the official one-liner from the README.
    tagline: 'Code analysis you can walk through',
  },

  // Shown once, statically, to screen readers in place of the rotating lines.
  // The rotator itself is aria-hidden: a live region re-announcing every five
  // seconds interrupts continuously, and none of it is new information.
  accessibleDescription:
    'Code-XR is a VS Code extension that analyzes your code and turns the metrics into a 3D scene you can explore in your browser: walk your codebase like a city, inspect its dependency graph, compare two points of its Git history, or replay its whole evolution. No VR headset required.',

  // Each line is checked against the extension README. None claims validation
  // on physical headset hardware — v1.2.0 was verified on desktop browsers and
  // on emulated WebXR sessions only.
  rotatingLines: [
    'No VR headset required: it runs in the browser you already have.',
    'Walk around your codebase like a city and watch it update as you edit.',
    'See the architecture, not just the files: dependencies as a 3D graph.',
    'Replay your Git history as a film, or compare two points side by side.',
    'Local analysis, local servers. No telemetry, no account.',
  ],

  stats: {
    // Stands in for a value while the Marketplace fetch is in flight. It is
    // deliberately NOT announced and there is no live region anywhere near this
    // strip: nobody asked for these six numbers, they land together, and
    // useCountUp then ramps three of them for ~900ms — a live region would read
    // a paragraph of moving digits over the hero headline. This exists so that
    // a card read DURING the fetch says something instead of naming a metric
    // and its source with silence where the figure belongs.
    loading: 'Loading',

    installs: {
      label: 'Active installs',
      detail: 'Marketplace API',
    },
    downloads: {
      label: 'Marketplace downloads',
      detail: 'Marketplace API',
    },
    // "Approx." is doing real work in this label — see the note in HeroStats.
    approxTotal: {
      label: 'Approx. total downloads',
      detail: 'Approximate',
      linkHint: 'install from the VS Code Marketplace',
    },
    rating: {
      label: 'Rating',
      // Pluralized against the live review count.
      detail: (count) => `${count} review${count === 1 ? '' : 's'}`,
      // The SPOKEN form of the score, and it is not redundant. Once the card
      // carries an href it also carries an aria-label, and an aria-label
      // REPLACES the whole accessible name — without this the linked card
      // announces "Rating, read the reviews…" and never the number it exists to
      // show. It cannot just reuse the visible value either: that string ends in
      // "★", which a screen reader says out loud as "black star".
      accessibleValue: (rating) => `${rating.toFixed(1)} out of 5`,
      // The card links to the listing's review tab once the count is real.
      // "read", not "leave": the strip is the first thing a visitor sees and
      // most of them have not run the extension yet, so the ASK belongs at the
      // bottom of the page (#feedback) where the reader has. The tab it lands
      // on carries both, so nothing is promised that is not there.
      linkHint: 'read the reviews on the VS Code Marketplace',
    },
    version: {
      label: 'Now live',
      // Shown when the publish date has not arrived from the Marketplace.
      fallbackDetail: 'VS Code Marketplace',
    },
    award: {
      linkHint: 'see the official awards page',
    },
  },

  actions: {
    install: 'Install Extension',
    source: 'View on GitHub',
  },
};
