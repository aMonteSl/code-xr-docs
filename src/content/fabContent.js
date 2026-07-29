// Floating quick-actions copy. The hrefs resolve in the section against
// siteContent.links via `linkKey`, so no URL is duplicated.
export const fab = {
  open: 'Open quick actions',
  close: 'Close quick actions',
  // The menu opens UPWARD, so the last entry is the one that lands nearest the
  // button: closest to the thumb and, per the stagger in FloatingActions, the
  // first to arrive. Tutorial goes there because it is the only action that
  // stays on this site, and it takes that slot without demoting Marketplace,
  // which is still the first thing read from the top.
  actions: [
    { id: 'marketplace', label: 'Marketplace', linkKey: 'marketplace', icon: 'external' },
    { id: 'github', label: 'GitHub', linkKey: 'github', icon: 'github' },
    { id: 'portfolio', label: 'Portfolio', linkKey: 'author', icon: 'globe' },
    { id: 'tutorial', label: 'Tutorial', linkKey: 'tutorial', icon: 'lesson' },
  ],
};
