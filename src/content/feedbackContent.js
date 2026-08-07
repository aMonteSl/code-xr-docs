// The home page's closing ask: leave a review, or star the repository.
//
// Its own module rather than a key inside authorContent because the block
// renders at the end of the Author section but is not ABOUT the author. If it
// ever moves — a subpage, a band of its own — the copy moves in one piece
// instead of being cut out of someone's biography.
//
// Named `feedback`, and the anchor is #feedback, for a reason that is easy to
// undo by accident: site.links.support is ALREADY taken, by the Buy-me-a-coffee
// URL the footer renders on all seven pages. Two different asks may coexist;
// two different meanings of one identifier in one file may not, and the section
// below imports both `site` and this module.
//
// TWO asks, ranked, not the three the extension README carries. The README's
// "Enjoying CodeXR? It helps more than you think" lists star, review and
// ideas-in-Issues. The third is dropped HERE because the issue tracker already
// has two homes on this page — the FAQ's "I found a bug. Where do I report
// it?" and the footer's "Bug reports". A third link to one URL is repetition,
// not a third ask, and it is exactly what turns a request into a wall of
// buttons.
//
// The review leads and the star follows because they are not the same lever. A
// rating is one of the handful of things the Marketplace lets a visitor sort
// and filter on, so it decides whether the extension is FOUND; a GitHub star is
// read by people who already found it. They also ask different people: one asks
// someone who ran the thing, the other someone who merely liked it.
//
// No live figure is written into this copy. The review count is on the
// Marketplace and in the hero stat strip, both of which keep themselves
// current; a number typed into this paragraph is wrong within the week, and "we
// only have one review" reads as pressure rather than as information.
export const feedback = {
  heading: 'If Code-XR was useful, say so',

  // Says what a review DOES and then caps the effort, which is the whole
  // argument. "sort" rather than "rank": the store's sort control literally
  // offers Rating, and that is a checkable claim — how the search ranking
  // weighs reviews is not, and this site does not guess. It does not say
  // "filter" either: the Marketplace has no rating filter, and this module is
  // not the place to start inventing capabilities.
  // "what got in your way" is deliberate: an ask that invites the bad review
  // too is the one that does not read as a growth hack.
  body: 'A rating is one of the few things the VS Code Marketplace lets people sort extensions by, which makes a review worth more to this project than any figure at the top of this page. A couple of honest sentences are plenty: what you analysed, what worked, and what got in your way.',

  // `linkKey` resolves against site.links in the section, the same convention
  // footerContent and authorContent use, so no URL is repeated. `primary` is
  // what makes the ranking above VISIBLE — by weight, which is the only
  // emphasis this palette allows.
  //
  // "Star on GitHub", not "Star it on GitHub": at a 320px viewport the panel's
  // content box is 224px and the default Button spends 74px on border, padding,
  // icon and gap. The longer label leaves 7px of slack and wraps to two lines
  // on any machine rendering Inter a hair wider; this one leaves 39px.
  actions: [
    { id: 'review', label: 'Leave a review', icon: 'review', linkKey: 'marketplaceReview', primary: true },
    { id: 'star', label: 'Star on GitHub', icon: 'github', linkKey: 'github' },
  ],

  // Small print naming each destination, and not decoration: the author's own
  // "GitHub" button sits about 120px above this one and points at a DIFFERENT
  // repository — the person, not the project. Naming CodeXR is what tells the
  // two apart. Same job as Academic's "Opens in a new tab" meta lines.
  note: "The review opens the extension's page on the Marketplace; the star goes to the CodeXR repository. Both open in a new tab.",
};
