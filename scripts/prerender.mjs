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
    const { whatsNew } = await vite.ssrLoadModule('/src/content/whatsNewContent.js');
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

    // ---------------------------------------------------------------- JSON-LD
    //
    // Every subpage's graph is built HERE, not in scripts/build-pages.mjs. That
    // generator owns the <head> boilerplate and writes a minimal stub; this owns
    // the shape of the graph, because the shape needs content (steps, video
    // metadata, breadcrumb titles) that only these modules have.
    //
    // Falsy fields are dropped on the way out. That is what lets a video ship
    // valid markup while its uploadDate is still unknown: see the note on
    // videoUploadDate in whatsNewContent.js. Never paper over a missing value
    // with a plausible one — uploadDate is a claim Google checks.
    const compact = (object) =>
      Object.fromEntries(Object.entries(object).filter(([, value]) => Boolean(value)));

    // The author node, emitted on every subpage. Before this, subpages carried
    // only `author: { "@id": ".../#author" }` while the Person itself lived on
    // the home alone, so the reference resolved to nothing on the page that made
    // it. Same @id as the home, so the two are one entity, not two.
    const AUTHOR_ID = `${ORIGIN}/#author`;
    const authorNode = {
      '@type': 'Person',
      '@id': AUTHOR_ID,
      name: 'Adrian Montes Linares',
      url: 'https://adrianmonteslinares.com/',
    };

    // `trail` is [name, path] pairs from the home down to the page itself.
    const breadcrumbLd = (trail) => ({
      '@type': 'BreadcrumbList',
      itemListElement: trail.map(([name, path], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: `${ORIGIN}${path}`,
      })),
    });

    const videoLd = ({ id, title, description, duration, uploadDate }) =>
      compact({
        '@type': 'VideoObject',
        name: title,
        description,
        duration,
        uploadDate,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        contentUrl: `https://www.youtube.com/watch?v=${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      });

    const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });

    // FAQPage belongs to the home alone — see the note above it.
    //
    // The tutorial's HowTo carries one HowToStep per step, generated rather than
    // hand-kept so a reworded step cannot leave the markup behind. Its
    // VideoObject goes on /tutorial/ ONLY, not on the home's teaser section, or
    // the same twelve minutes would be claimed by two URLs.
    const tutorialLd = graph([
      {
        '@type': 'HowTo',
        name: tutorial.heading,
        description: tutorial.seoDescription,
        url: `${ORIGIN}/tutorial/`,
        inLanguage: 'en',
        author: { '@id': AUTHOR_ID },
        about: { '@type': 'SoftwareApplication', name: 'Code-XR' },
        totalTime: TUTORIAL_VIDEO.duration,
        step: tutorial.steps.map((step) => ({
          '@type': 'HowToStep',
          position: step.number,
          name: step.title,
          text: step.lead,
          url: `${ORIGIN}/tutorial/#${step.part}`,
        })),
        video: videoLd({
          id: TUTORIAL_VIDEO.id,
          title: TUTORIAL_VIDEO.title,
          description: tutorial.seoDescription,
          duration: TUTORIAL_VIDEO.duration,
          uploadDate: TUTORIAL_VIDEO.uploadDate,
        }),
      },
      breadcrumbLd([
        ['Code-XR', '/'],
        ['Tutorial', '/tutorial/'],
      ]),
      authorNode,
    ]);

    const analysisIndexLd = graph([
      {
        '@type': 'TechArticle',
        headline: analysisPages.index.seoTitle,
        description: analysisPages.index.seoDescription,
        url: `${ORIGIN}/analysis/`,
        inLanguage: 'en',
        author: { '@id': AUTHOR_ID },
        isPartOf: { '@type': 'WebSite', url: `${ORIGIN}/` },
        about: { '@type': 'SoftwareApplication', name: 'Code-XR' },
      },
      breadcrumbLd([
        ['Code-XR', '/'],
        ['Analyses', '/analysis/'],
      ]),
      authorNode,
    ]);

    // One VideoObject per detail page, for the demo that page embeds. Four more
    // video rich-result candidates, from data the content module already had.
    const analysisPageLd = (page) => {
      const analysis = whatsNew.analyses.find((item) => item.id === page.id);

      return graph([
        {
          '@type': 'TechArticle',
          headline: page.seoTitle,
          description: page.seoDescription,
          url: `${ORIGIN}/analysis/${page.slug}/`,
          inLanguage: 'en',
          author: { '@id': AUTHOR_ID },
          isPartOf: { '@type': 'WebSite', url: `${ORIGIN}/` },
          about: { '@type': 'SoftwareApplication', name: 'Code-XR' },
          video: videoLd({
            id: analysis.videoId,
            title: analysis.videoTitle,
            description: analysis.description,
            duration: analysis.videoDuration,
            uploadDate: analysis.videoUploadDate,
          }),
        },
        breadcrumbLd([
          ['Code-XR', '/'],
          ['Analyses', '/analysis/'],
          [page.breadcrumb, `/analysis/${page.slug}/`],
        ]),
        authorNode,
      ]);
    };

    const pages = [
      {
        file: 'dist/index.html',
        loc: `${ORIGIN}/`,
        priority: '1.0',
        element: createElement(App),
        injectFaq: true,
      },
      // Every subpage replaces the generator's stub. `replaceLd` is asserted
      // below, so a page that ever stopped matching fails the build instead of
      // silently shipping the stub.
      {
        file: 'dist/analysis/index.html',
        loc: `${ORIGIN}/analysis/`,
        priority: '0.9',
        element: createElement(AnalysisIndexPage),
        injectFaq: false,
        replaceLd: analysisIndexLd,
      },
      {
        file: 'dist/tutorial/index.html',
        loc: `${ORIGIN}/tutorial/`,
        priority: '0.9',
        element: createElement(TutorialPage),
        injectFaq: false,
        replaceLd: tutorialLd,
      },
      ...analysisPages.pages.map((page) => ({
        file: `dist/analysis/${page.slug}/index.html`,
        loc: `${ORIGIN}/analysis/${page.slug}/`,
        priority: '0.8',
        element: createElement(AnalysisPage, { slug: page.slug }),
        injectFaq: false,
        replaceLd: analysisPageLd(page),
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
