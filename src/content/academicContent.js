import { award } from '@/content/awardContent';

// The academic material behind CodeXR: the VISSOFT poster, the thesis and the
// defence presentation. Same three-card shape the previous site used.
//
// The award links come from awardContent rather than being copied here — that
// module is the single source of truth for anything about the recognition, and
// its wording is verbatim from the official awards page.
//
// One correction against the old site: it labelled the first card "Conference
// Paper" while the file it served is `vissoft2025-poster.pdf`, the poster. The
// paper itself is not hosted here, it is published — hence the DOI and IEEE
// Xplore links in the note.
export const academic = {
  eyebrow: 'Research',
  heading: 'Academic resources',
  intro:
    'The work CodeXR came out of, in full: the artifact recognised at VISSOFT 2025, the thesis it was built for, and the presentation used to defend it.',

  // The published paper. The title, the authors and both links come from
  // awardContent, whose own comment says they were put there "for the research
  // section that will follow" — this is that section finally using them.
  //
  // The paper's TITLE is the DOI link text. "DOI" as anchor text says nothing
  // to a reader and nothing to a search engine, and the title is the single
  // most citable string the project has.
  paper: {
    label: 'Published paper',
    authorsIntro: 'By',
    venueSuffix: 'IEEE VISSOFT 2025',
    mirrorLabel: 'Also on IEEE Xplore',
  },

  note: {
    label: 'Note',
    body: 'These materials are the academic foundation of CodeXR and go into the research methodology, the technical implementation and the evaluation behind the extension.',
  },

  resources: [
    {
      id: 'poster',
      icon: 'award',
      title: 'Conference poster, VISSOFT 2025',
      description:
        'The artifact presented at VISSOFT 2025, the IEEE conference on software visualization, where it received the Distinguished Artifact Award.',
      tag: award.name,
      action: { kind: 'download', file: award.posterFilename, label: 'Download the poster' },
      meta: 'PDF · 960 KB',
    },
    {
      id: 'thesis',
      icon: 'file',
      title: 'Final Degree Project (TFG)',
      description:
        'The complete thesis behind CodeXR: the research, the development and the evaluation, with the methodology and the full analysis.',
      tag: 'Academic thesis',
      action: {
        kind: 'download',
        file: 'tfg_Adrian_Montes_Linares.pdf',
        label: 'Download the thesis',
      },
      // Stated because 7.5 MB is worth knowing before clicking on a phone.
      meta: 'PDF · 7.5 MB',
    },
    {
      id: 'presentation',
      icon: 'presentation',
      title: 'Defence presentation',
      description:
        'The interactive presentation used at the thesis defence: the findings, the demonstrations and the visual summaries of the project.',
      tag: 'Interactive web',
      action: {
        kind: 'external',
        href: 'https://code-xr-presentacion.my.canva.site/',
        label: 'Open the presentation',
      },
      meta: 'Opens in a new tab',
    },
  ],
};
