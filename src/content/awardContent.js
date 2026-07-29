// The VISSOFT 2025 recognition. Every string here is verbatim from the
// official ICSME 2025 awards page — this is a real award, so the wording is
// not paraphrased and never softened to "accepted at".
//
// Only `name` and `conference` surface in the hero badge; the artifact title,
// authors and the supporting links are here for the research section that will
// follow.
export const award = {
  name: 'Distinguished Artifact Award',
  conference: 'IEEE VISSOFT 2025',
  // The venue without the year, for slots that show the year separately.
  venue: 'IEEE VISSOFT',
  year: 2025,
  artifactTitle: 'Real-Time XR Visualizations of Code Metrics in the IDE',
  authors: ['David Moreno-Lumbreras', 'Gregorio Robles', 'Adrián Montes Linares'],
  summary:
    'Recognized with the Distinguished Artifact Award at IEEE VISSOFT 2025, the international conference on software visualization.',
  links: {
    // The authoritative proof of the award — where the hero badge points.
    officialAwards: 'https://conf.researchr.org/info/icsme-2025/icsme-2025-awards',
    certificate: 'https://adrianmonteslinares.com/documents/distinghuished_artifact_award.pdf',
    doi: 'https://doi.org/10.1109/VISSOFT67405.2025.00034',
    ieeeXplore: 'https://ieeexplore.ieee.org/document/11175653',
  },
  // Lives in public/documents/.
  posterFilename: 'vissoft2025-poster.pdf',
};
