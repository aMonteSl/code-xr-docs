// Renders every page to real HTML at build time and writes it into dist/.
//
// Why this exists: without it the deployed body is literally
// `<div id="root"></div>`. All the copy arrives only after the JS bundle
// executes. Google renders JS, but on a deferred second pass; Bing, social-card
// scrapers, chat unfurlers and most AI crawlers do not.
//
// It loads the page components through Vite's SSR pipeline rather than the
// built browser bundle — they import no CSS and no fonts (the *main.jsx entries
// do), so nothing here needs a stylesheet loader.
//
// It also owns three things that were hand-maintained and went stale: the
// JSON-LD softwareVersion, the home's FAQPage block, and the sitemap. Each is
// generated from the module that already owns the data, so there is still one
// home per fact.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://code-xr.adrianmonteslinares.com';

const run = async () => {
  const vite = await createServer({
    root,
    logLevel: 'error',
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx');
    const { default: AnalysisPage } = await vite.ssrLoadModule('/src/app/AnalysisPage.jsx');
    const { default: AnalysisIndexPage } = await vite.ssrLoadModule(
      '/src/app/AnalysisIndexPage.jsx'
    );
    const { default: TutorialPage } = await vite.ssrLoadModule('/src/app/TutorialPage.jsx');
    const { site } = await vite.ssrLoadModule('/src/content/siteContent.js');
    const { faq } = await vite.ssrLoadModule('/src/content/faqContent.js');
    const { analysisPages } = await vite.ssrLoadModule('/src/content/analysisPagesContent.js');
    const { tutorial, TUTORIAL_VIDEO } = await vite.ssrLoadModule(
      '/src/content/tutorialContent.js'
    );

    // FAQPage belongs to the home alone — it describes questions only that page
    // answers, and duplicating it onto the detail pages would claim the same
    // rich result four more times.
    const faqLd = {
      '@type': 'FAQPage',
      mainEntity: faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    };

    // The tutorial's HowTo, with one step per step and the video attached.
    //
    // Generated here rather than written into the template for the same reason
    // as the FAQ: the steps already exist in tutorialContent, and a hand-kept
    // copy in the generator would be stale the first time one is reworded.
    //
    // The VideoObject goes on /tutorial/ ONLY, not on the home's teaser section,
    // or the same twelve minutes would be claimed by two URLs.
    const tutorialLd = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: tutorial.heading,
      description: tutorial.seoDescription,
      url: `${ORIGIN}/tutorial/`,
      inLanguage: 'en',
      author: { '@id': `${ORIGIN}/#author` },
      about: { '@type': 'SoftwareApplication', name: 'Code-XR' },
      totalTime: TUTORIAL_VIDEO.duration,
      step: tutorial.steps.map((step) => ({
        '@type': 'HowToStep',
        position: step.number,
        name: step.title,
        text: step.lead,
        url: `${ORIGIN}/tutorial/#${step.part}`,
      })),
      video: {
        '@type': 'VideoObject',
        name: TUTORIAL_VIDEO.title,
        description: tutorial.seoDescription,
        duration: TUTORIAL_VIDEO.duration,
        uploadDate: TUTORIAL_VIDEO.uploadDate,
        embedUrl: `https://www.youtube-nocookie.com/embed/${TUTORIAL_VIDEO.id}`,
        contentUrl: `https://www.youtube.com/watch?v=${TUTORIAL_VIDEO.id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${TUTORIAL_VIDEO.id}/maxresdefault.jpg`,
      },
    };

    const pages = [
      {
        file: 'dist/index.html',
        loc: `${ORIGIN}/`,
        priority: '1.0',
        element: createElement(App),
        injectFaq: true,
      },
      {
        file: 'dist/analysis/index.html',
        loc: `${ORIGIN}/analysis/`,
        priority: '0.9',
        element: createElement(AnalysisIndexPage),
        injectFaq: false,
      },
      {
        file: 'dist/tutorial/index.html',
        loc: `${ORIGIN}/tutorial/`,
        priority: '0.9',
        element: createElement(TutorialPage),
        injectFaq: false,
        // Replaces the HowTo stub the generator wrote, which carries only the
        // headline and description.
        replaceLd: tutorialLd,
      },
      ...analysisPages.pages.map((page) => ({
        file: `dist/analysis/${page.slug}/index.html`,
        loc: `${ORIGIN}/analysis/${page.slug}/`,
        priority: '0.8',
        element: createElement(AnalysisPage, { slug: page.slug }),
        injectFaq: false,
      })),
    ];

    for (const page of pages) {
      const target = join(root, page.file);
      const markup = renderToString(page.element);
      let html = await readFile(target, 'utf8');

      if (!html.includes('<div id="root"></div>')) {
        throw new Error(`${page.file} has no empty #root to fill — did the build change?`);
      }

      html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

      // One per file, so a non-global replace is correct — but it has to run
      // per page, not once for the whole build.
      html = html.replace(
        /("softwareVersion":\s*")[^"]*(")/,
        (_, open, close) => `${open}${site.version}${close}`
      );

      if (page.injectFaq) {
        html = html.replace('"@graph": [', `"@graph": [\n          ${JSON.stringify(faqLd)},`);
      }

      // Swaps the generator's whole ld+json block for the full one. Anchored on
      // the opening tag through to its close, and asserted, because a silently
      // unmatched replace would ship the stub and nobody would notice.
      if (page.replaceLd) {
        const block = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;

        if (!block.test(html)) {
          throw new Error(`${page.file} has no ld+json block to replace.`);
        }

        html = html.replace(
          block,
          `<script type="application/ld+json">\n${JSON.stringify(page.replaceLd, null, 2)}\n    </script>`
        );
      }

      await writeFile(target, html, 'utf8');

      const words = markup.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
      console.log(`[prerender] ${page.file.padEnd(46)} ~${words} words`);
    }

    // Generated whole, not patched: the old regex had no `g` flag and would
    // have stamped only the first <lastmod> of five.
    const today = new Date().toISOString().slice(0, 10);
    const urls = pages
      .map(
        (page) =>
          `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
      )
      .join('\n');

    await writeFile(
      join(root, 'dist/sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      'utf8'
    );

    console.log(
      `[prerender] softwareVersion ${site.version}, ${faq.items.length} FAQ entries on the home, ` +
        `sitemap regenerated with ${pages.length} URLs (lastmod ${today})`
    );
  } finally {
    await vite.close();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
