// The loose ends: the questions a reader asks that the narrative sections do
// not put in question form.
//
// Three of these (headset, languages, requirements) restate facts that live in
// the "Requirements" section. That is a knowing exception to the one-home-per-
// fact rule, taken for two reasons: the question form is what earns the
// FAQPage rich result, and a reader who scans for a question mark never finds
// a card body. Each answer is ONE sentence that points at the real home rather
// than a copy of it — keep them that way.
//
// "Is Code-XR free?" is the only one with no home at all today: the word
// "free" appears nowhere on the site in relation to the extension, which for a
// Marketplace listing is the first thing people want to know.
//
// Every answer is checkable against the extension README on the v1.2.0 branch,
// same rule as every other content module. `answer` is plain text on purpose:
// scripts/prerender.mjs lifts these verbatim into the FAQPage JSON-LD, and
// schema.org answers must match what the page shows.
export const faq = {
  eyebrow: 'FAQ',
  heading: 'Questions people ask',
  intro:
    'The short answers. Each one links to the part of the page that goes into it properly.',

  items: [
    {
      id: 'price',
      question: 'Is Code-XR free?',
      answer:
        'Yes. It is free on the VS Code Marketplace, and the extension and its analysis pipeline are open source under GPLv3.',
    },
    {
      id: 'headset',
      question: 'Do I need a VR headset?',
      answer:
        'No. Mouse and keyboard in any desktop browser is enough, and the 2D LivePanel never leaves VS Code. A WebXR headset only makes the same scene immersive.',
    },
    {
      id: 'languages',
      question: 'Does it support my language?',
      answer:
        'It reads 24 languages plus the HTML DOM, including JavaScript, TypeScript, Python, C and C++, C#, Java, Go, Ruby, PHP, Swift and Kotlin, with cyclomatic complexity measured through Lizard.',
    },
    {
      id: 'privacy',
      question: 'Does my code leave my machine?',
      answer:
        'No. Analysis and servers run locally, there is no telemetry and no account, and nothing is downloaded without asking you first. Sharing a session with someone outside your network goes through an outbound tunnel that nobody enters without a six-digit code you read out yourself, and you can turn the whole capability off in Server Configuration.',
    },
    {
      id: 'requirements',
      question: 'What do I need installed?',
      answer:
        'VS Code 1.98 or newer, Node.js 16 or newer, and Python 3.7 or newer. The Python environment is created for you on first use.',
    },
    {
      id: 'bug',
      question: 'I found a bug. Where do I report it?',
      answer:
        'Open an issue on the CodeXR repository. Include your VS Code version, your operating system and the analysis you were running.',
      // Rendered as a link on this answer only. `site.links.issues` had been
      // sitting in siteContent unused since it was written; this is its first
      // consumer.
      actionLabel: 'Report an issue on GitHub',
      actionLinkKey: 'issues',
    },
  ],
};
