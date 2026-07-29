// The properties block. Deliberately NOT another list of the four analyses —
// About introduces them and What's new develops each one with its own video.
// This section answers the questions those two leave open: what does it cost
// me, what does it need, where does my code go, what is it built on.
//
// Every claim here is checkable in the extension README on the v1.2.0 branch:
//   - local analysis, local servers, no telemetry, no account, nothing
//     downloaded without asking
//   - no headset required; the same scene becomes immersive if you have one
//   - 24 code languages plus HTML DOM, complexity via Lizard
//   - Node.js 16+ and Python 3.7+, the Python environment managed for you
//   - GPLv3
// The one thing this must never claim is validation on physical headset
// hardware: v1.2.0 was exercised on desktop browsers and Meta's Immersive Web
// Emulator, and the README says so explicitly.
export const features = {
  // Matches the nav label word for word, deliberately: a reader who clicks
  // "Requirements" must land on something that says "Requirements", or the
  // scent breaks. The heading below is where the voice lives.
  eyebrow: 'Requirements',
  heading: 'What it needs, and what it is built on',
  intro:
    'Everything above runs from your editor, on your machine. No account, no service in the middle, and no hardware you do not already own.',

  properties: [
    {
      id: 'local',
      icon: 'shield',
      title: 'Local by default',
      body: 'Analysis and servers run on your machine. No telemetry, no account, and nothing is downloaded without asking you first.',
    },
    {
      id: 'no-headset',
      icon: 'monitor',
      title: 'No headset required',
      body: 'Mouse and keyboard in any desktop browser, and the 2D LivePanel never leaves VS Code. With a WebXR headset the same scene simply becomes immersive.',
    },
    {
      id: 'languages',
      icon: 'code',
      title: '24 languages, plus the DOM',
      // "cyclomatic complexity" spelled out on purpose: it is exactly what
      // Lizard measures, and it was the one term a reader would search for
      // that appeared nowhere on the site.
      body: 'JavaScript, TypeScript, Python, C and C++, C#, Java, Go, Ruby, PHP, Swift, Kotlin and more, with cyclomatic complexity measured through Lizard.',
    },
    {
      id: 'live',
      icon: 'refresh',
      title: 'Live as you edit',
      body: 'Save a file and the scene updates by itself. The analysis follows the working directory, not a snapshot you have to regenerate.',
    },
    {
      id: 'mapping',
      icon: 'sliders',
      title: 'Any metric, any channel',
      body: 'Field Mapping puts every metric behind area, height, colour or position, so a question you care about becomes something you can see across the room.',
    },
    {
      id: 'open',
      icon: 'scale',
      title: 'Open source, GPLv3',
      body: 'The extension and its analysis pipeline are public, and the artifact behind it was recognised at IEEE VISSOFT 2025.',
    },
  ],

  requirements: {
    title: 'What you need',
    items: ['VS Code 1.98 or newer', 'Node.js 16+', 'Python 3.7+, set up for you on first use'],
  },

  stack: {
    title: 'Built with',
    linkHint: 'Open the official site',
    items: [
      { id: 'vscode', name: 'VS Code API', logo: 'vscode.svg', description: 'The extension surface: sidebar, commands and panels.', url: 'https://code.visualstudio.com/api/references/vscode-api' },
      { id: 'typescript', name: 'TypeScript', logo: 'typescript.svg', description: 'The extension itself, typed end to end.', url: 'https://www.typescriptlang.org/' },
      { id: 'python', name: 'Python and Lizard', logo: 'python.svg', description: 'The analysis engine and its complexity metrics.', url: 'https://pypi.org/project/lizard/' },
      { id: 'node', name: 'Node.js', logo: 'nodejs.svg', description: 'The runtime and the local servers that hold the scene.', url: 'https://nodejs.org/' },
      { id: 'aframe', name: 'A-Frame', logo: 'aframe.png', description: 'The 3D scene, declared as HTML.', url: 'https://aframe.io/' },
      { id: 'babiaxr', name: 'BabiaXR', logo: 'babiaxr.png', description: 'The data visualisation components the charts are built from.', url: 'https://babiaxr.gitlab.io/' },
      { id: 'webxr', name: 'WebXR', logo: 'webxr.png', description: 'The standard that turns the same page into a VR or AR session.', url: 'https://www.w3.org/TR/webxr/' },
      { id: 'treesitter', name: 'tree-sitter', logo: 'treesitter.png', description: 'The structured parsers behind the dependency graph.', url: 'https://tree-sitter.github.io/tree-sitter/' },
      { id: 'cloudflare', name: 'Cloudflare', logo: 'cloudflare.svg', description: 'The outbound tunnel that cross-network sessions travel through.', url: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/' },
    ],
  },
};
