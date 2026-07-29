// Navigation copy. The navbar renders one anchor per entry, pointing at
// `#${id}` — so an entry may only be added here once a section with that id
// actually exists on the page.
//
// This array MUST stay in the same order as the sections in app/App.jsx.
// Nothing derives one from the other: the navbar renders these in array order,
// and useActiveSection walks them in array order to decide which one the
// reader is in. Get them out of step and the menu lists sections in an order
// the page does not follow.
//
// `features` is labelled by what a reader searches for, not by its eyebrow.
// It is the section holding the requirements, the supported languages, the
// privacy answer and the licence — "Under the hood" promised internals and
// hid all of that from anyone scanning the menu for "what do I need".
export const nav = {
  sections: [
    // 'Overview', not 'What is Code-XR': adding the FAQ entry put the row 21px
    // over its 822px of space at 1280 and left "Author" orphaned on a second
    // line. This is the longest label by far (114px vs 92 for the next), it is
    // this section's own eyebrow, and matching the eyebrow is what seven of the
    // other labels already do.
    { id: 'about', label: 'Overview' },
    { id: 'whats-new', label: "What's new" },
    // 'Tutorial', the shortest honest label for it: with eleven entries the row
    // has 56px of slack at 1280, and anything longer here spends it.
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'collaboration', label: 'Collaboration' },
    // 'Projects', not 'Tested projects', and this is a measurement not a
    // preference. It is the longest label in the bar (103px against 92 for the
    // next), and with the Tutorial entry added the row needed 820px at 1280 and
    // had exactly 820: no slack at all, so any machine rendering Inter a hair
    // wider would orphan "Author" on a second line. Shortening this one buys
    // 49px, in the same range as the 59px of deliberate slack Container
    // documents. Nothing is lost: no other entry is about projects, and the
    // section's own eyebrow still reads "Tested projects".
    { id: 'tested-projects', label: 'Projects' },
    { id: 'features', label: 'Requirements' },
    { id: 'install', label: 'Install' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'faq', label: 'FAQ' },
    { id: 'academic', label: 'Research' },
    { id: 'author', label: 'Author' },
  ],
  actions: {
    install: 'Install',
    githubLabel: 'Code-XR on GitHub',
  },
  theme: {
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },
  menu: {
    open: 'Open navigation menu',
    close: 'Close navigation menu',
  },
};
