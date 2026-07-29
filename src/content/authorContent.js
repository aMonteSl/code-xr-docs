// Who built CodeXR. Same shape the previous site used: portrait and bio in one
// card, then three short cards under it.
//
// No URL lives here. `linkKey` resolves against site.links in the section, the
// same convention footerContent uses, so the portfolio address exists in one
// place only.
export const author = {
  eyebrow: 'Author',
  heading: 'Meet the author',
  intro:
    'The developer behind CodeXR, and the idea that turned a Final Degree Project into a VS Code extension.',

  name: 'Adrián Montes Linares',
  portraitAlt: 'Portrait of Adrián Montes Linares, the creator of CodeXR',

  chips: [
    { id: 'education', icon: 'graduation', label: 'Telecommunications Engineering student' },
    { id: 'xr', icon: 'code', label: 'First XR experience' },
    { id: 'location', icon: 'pin', label: 'Spain' },
  ],

  paragraphs: [
    'Telecommunications Engineering student with great motivation to learn and apply that knowledge in real environments. CodeXR is my Final Degree Project, my first experience with XR technologies, and a demonstration of how ordinary code development can be improved with immersive 3D visualization.',
    'I have a problem-solving, analytical profile and a talent for finding creative solutions. I care about quality, I am meticulous with detail, and I am used to delivering finished work, alone and in a team. This project bridges my telecommunications background and current XR technology in an extension that changes how developers look at their own code.',
  ],

  actions: [
    { id: 'github', label: 'GitHub', icon: 'github', linkKey: 'authorGithub' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', linkKey: 'authorLinkedin' },
    { id: 'portfolio', label: 'Portfolio', icon: 'globe', linkKey: 'author' },
    { id: 'contact', label: 'Contact', icon: 'mail', linkKey: 'authorEmail', primary: true },
  ],

  highlights: [
    {
      id: 'education',
      icon: 'graduation',
      title: 'Education',
      body: 'Telecommunications Engineering student, focused on communications and emerging technologies.',
    },
    {
      id: 'tfg',
      icon: 'code',
      title: 'Final Degree Project',
      body: 'CodeXR as the project itself, exploring XR technologies for software visualization.',
    },
    {
      id: 'approach',
      icon: 'sparkle',
      title: 'Approach',
      body: 'Creative problem-solving, attention to detail, and a commitment to shipping work that is finished.',
    },
  ],
};
