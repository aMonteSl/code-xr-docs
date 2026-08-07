import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// The new site's module is the source of truth now: adding a project there is
// all it takes for its dashboard folder to be picked up here.
import { testedProjects } from '../src/content/testedProjectsContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const importRoot = path.join(rootDir, 'dashboard-imports');
const publicDashboardsRoot = path.join(rootDir, 'public', 'dashboards');

const pathExists = async (targetPath) => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const getExportDirectories = async (projectImportDir) => {
  const entries = await readdir(projectImportDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);
};

// A CodeXR export replays its manifest entities as soon as the dashboard boots,
// and the `analysis-view` one dictates which analysis the scene opens on: the
// JetUML export is saved mid-movie, so it opened on the project evolution
// rather than on the classic code city.
//
// Drop ONLY that entity. The rest are data pointers — `datasetUrl` for the
// dependency graph, `resultUrl` for the evolution movie — and they are what the
// in-scene switcher needs to fill a mode when the visitor picks it. Emptying
// the array whole (which this did until the schemaVersion 3 exports landed)
// left every mode selectable and permanently blank: the runtime reported
// `dependency-graph` active with `dataset: null`, because nothing on the page
// knew where the 3 MB dependencies JSON lived.
//
// Keeping them costs nothing at load: the datasets are fetched when the mode is
// entered, not at boot.
//
// Only the PUBLISHED copy is rewritten; the folder under dashboard-imports/
// keeps the export exactly as CodeXR produced it.
const clearReplayedEntities = async (projectPublicDir, projectId) => {
  const manifestPath = path.join(projectPublicDir, 'codexr-export-manifest.json');

  // Exports made before the manifest existed simply have nothing to clear.
  if (!(await pathExists(manifestPath))) {
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const entities = Array.isArray(manifest.entities) ? manifest.entities : [];
  const kept = entities.filter((entity) => entity?.entityKind !== 'analysis-view');

  if (kept.length === entities.length) {
    return;
  }

  manifest.entities = kept;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(
    `[dashboards] ${projectId}: dropped ${entities.length - kept.length} opening-view entit${
      entities.length - kept.length === 1 ? 'y' : 'ies'
    } so the dashboard opens on the classic analysis; kept ${kept.length} dataset pointer(s).`
  );
};

// A CodeXR export is a full HTML page, and TestedProjects links to it with a
// real, followable <a href> — so every dashboard and its guide.html is a
// crawlable page. Left alone they get indexed: no robots meta, no canonical,
// the three guide.html files all titled "CodeXR Guide", and the index.html
// files with a bare <html> and no lang. Six thin near-duplicates competing
// with the site they belong to.
//
// Fixed here rather than in robots.txt on purpose: a Disallow would stop
// crawlers READING the noindex, and Google can still index a blocked URL it
// finds linked. Noindex only works on a page that stays crawlable.
const normaliseForCrawlers = async (projectPublicDir, projectId) => {
  const pages = ['index.html', 'guide.html'];
  let patched = 0;

  for (const page of pages) {
    const pagePath = path.join(projectPublicDir, page);

    if (!(await pathExists(pagePath))) {
      continue;
    }

    const original = await readFile(pagePath, 'utf8');
    let html = original;

    if (!/<meta\s+name=["']robots["']/i.test(html)) {
      html = html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}\n<meta name="robots" content="noindex">`);
    }

    // The exports ship a bare <html>; the guides already carry lang="en".
    if (!/<html[^>]*\slang=/i.test(html)) {
      html = html.replace(/<html(\s[^>]*)?>/i, (_, attrs = '') => `<html lang="en"${attrs ?? ''}>`);
    }

    // The exports also ship no viewport meta, so phones lay the embedded
    // scene out at the legacy 980px virtual width and scale it down — it
    // arrives pre-shrunk inside DashboardEmbed's iframe. A-Frame injects a
    // viewport meta at runtime, but only after ~500 KB of JS boots; the first
    // layout has already happened by then. The guides carry one, so the test
    // makes this a no-op there.
    if (!/<meta\s+name=["']viewport["']/i.test(html)) {
      html = html.replace(
        /<head(\s[^>]*)?>/i,
        (head) => `${head}\n<meta name="viewport" content="width=device-width, initial-scale=1">`
      );
    }

    if (html !== original) {
      await writeFile(pagePath, html, 'utf8');
      patched += 1;
    }
  }

  if (patched > 0) {
    console.log(`[dashboards] ${projectId}: marked ${patched} page(s) noindex, set lang and viewport.`);
  }
};

await mkdir(importRoot, { recursive: true });
await mkdir(publicDashboardsRoot, { recursive: true });

for (const project of testedProjects.projects.filter((item) => item.dashboardPreview)) {
  const projectImportDir = path.join(importRoot, project.id);
  const projectPublicDir = path.join(publicDashboardsRoot, project.id);

  await mkdir(projectImportDir, { recursive: true });

  const exportDirectories = await getExportDirectories(projectImportDir);

  if (exportDirectories.length > 1) {
    throw new Error(
      `Multiple dashboard exports found for "${project.id}" in ${projectImportDir}. Keep exactly one export folder there before building.`
    );
  }

  if (exportDirectories.length === 0) {
    console.log(`[dashboards] ${project.id}: no new export detected, keeping current published dashboard.`);
    // Still normalise: a dashboard published before this step existed would
    // otherwise keep opening on whatever its manifest replays.
    await clearReplayedEntities(projectPublicDir, project.id);
    await normaliseForCrawlers(projectPublicDir, project.id);
    continue;
  }

  const sourceExportDir = path.join(projectImportDir, exportDirectories[0]);
  const sourceIndex = path.join(sourceExportDir, 'index.html');

  if (!(await pathExists(sourceIndex))) {
    throw new Error(
      `Dashboard export for "${project.id}" is missing index.html at ${sourceIndex}.`
    );
  }

  await rm(projectPublicDir, { recursive: true, force: true });
  await cp(sourceExportDir, projectPublicDir, { recursive: true, force: true });
  await clearReplayedEntities(projectPublicDir, project.id);
  await normaliseForCrawlers(projectPublicDir, project.id);

  console.log(
    `[dashboards] ${project.id}: synced export "${exportDirectories[0]}" to public/dashboards/${project.id}.`
  );
}
