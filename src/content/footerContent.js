// Footer copy: labels and order only. The hrefs are composed in the Footer
// section from siteContent.links and awardContent.links, so no URL lives in
// two places. `linkKey` resolves against site.links; `award: true` resolves
// against award.links.doi instead.
export const footer = {
  links: [
    { id: 'marketplace', label: 'Marketplace', linkKey: 'marketplace' },
    { id: 'github', label: 'GitHub', linkKey: 'github', icon: 'github' },
    { id: 'issues', label: 'Bug reports', linkKey: 'issues' },
    { id: 'author', label: 'Adrián Montes Linares', linkKey: 'author' },
    { id: 'support', label: 'Buy me a coffee', linkKey: 'support' },
    { id: 'paper', label: 'VISSOFT 2025 paper', award: true },
  ],
  copyrightName: 'Code-XR',
};
