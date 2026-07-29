// Generates the display variants of every release screenshot.
//
// The masters are 2x captures: the six analysis shots alone are ~2.9 MB each at
// 2555px wide, and they render in card slots that never exceed ~812 CSS px.
// This derives light AVIF/WebP copies for those slots and leaves the masters
// untouched — they stay the archive and the source this script reads next run.
//
// Run by hand (`npm run optimize:screenshots`) and commit the output, exactly
// like scripts/optimize-hero.mjs. Deliberately NOT part of prebuild: sharp
// ships native binaries and CI has no reason to build them for assets that
// change once per release.
//
// Two things are written:
//   public/assets/thumbs/<version>/<path>/<name>-<width>.<avif|webp>
//   src/lib/releaseImageWidths.js  — which widths each source actually has
//
// The manifest exists because the sources are wildly heterogeneous (266px to
// 2559px wide). A fixed srcset ladder would either upscale the small ones or
// advertise files that were never written, and a 404 inside a srcset is a
// broken image, not a fallback.
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'public/assets/thumbs');
const MANIFEST = join(root, 'src/lib/releaseImageWidths.js');

// All masters sit OUTSIDE public/ precisely because nothing fetches them:
// publishing megabytes no visitor downloads only inflates the deploy. The one
// exception lives in public/assets/releases/ still — performance-v1.1.0.gif,
// which the gallery serves as-is because sharp would collapse an animated GIF
// to its first frame (see SOURCE_EXTENSIONS below).
const SOURCE_ROOTS = [join(root, 'assets-src/releases')];

// 640 covers phones and desktop at 1x; 1280 covers the widest card slot at 2x;
// 1920 exists for the lightbox, which renders up to 1152 CSS px and is the one
// place a visitor asked to look closely.
const LADDER = [640, 1280, 1920];

// Higher than the hero's (55/78): these are screenshots of UI text, where
// ringing around glyphs shows long before it would on a photographic render.
const FORMATS = [
  { ext: 'avif', encode: (pipeline) => pipeline.avif({ quality: 60 }) },
  { ext: 'webp', encode: (pipeline) => pipeline.webp({ quality: 82 }) },
];

// Animated GIFs would collapse to their first frame, and the raster formats
// below are the only ones sharp is asked to read here.
const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

// The source's own width is always published: nothing above it is real detail,
// and for anything under 1920 it IS the sharpest copy that can exist — dropping
// it in favour of a ladder step would leave the lightbox upscaling. Below that,
// a ladder step only earns a file of its own if it is meaningfully smaller than
// the variant above it; a 1280 sitting 14% under a 1458 native is a duplicate.
const MIN_STEP_RATIO = 1.25;

const widthsFor = (sourceWidth) => {
  const native = Math.min(sourceWidth, LADDER.at(-1));
  const steps = LADDER.filter((width) => width < native && native / width >= MIN_STEP_RATIO);

  return [...steps, native];
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }

  return files;
};

const run = async () => {
  // Wiped rather than merged: a variant whose source was renamed or deleted
  // would otherwise sit in public/ forever and ship on every deploy.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  // [root, file] pairs, so each key stays relative to the root it came from.
  const sources = [];
  for (const sourceRoot of SOURCE_ROOTS) {
    for (const file of await walk(sourceRoot)) {
      sources.push([sourceRoot, file]);
    }
  }
  sources.sort((a, b) => a[1].localeCompare(b[1]));

  const manifest = {};
  let sourceBytes = 0;
  let outputBytes = 0;

  // Every source gets at least one variant, however small — no exceptions.
  // The v1-2-0 masters are not published, so a source left out of the manifest
  // would fall through getReleaseImageSources to a URL that 404s.
  for (const [sourceRoot, source] of sources) {
    // POSIX separators: this key is read by the browser, not by the shell.
    const key = relative(sourceRoot, source).split(sep).join(posix.sep);
    const { width } = await sharp(source).metadata();
    const { size } = await stat(source);
    sourceBytes += size;

    const widths = widthsFor(width);
    const targetDir = join(OUT_DIR, dirname(key));
    const base = key.slice(0, -extname(key).length);
    await mkdir(targetDir, { recursive: true });

    for (const targetWidth of widths) {
      for (const { ext, encode } of FORMATS) {
        const buffer = await encode(sharp(source).resize({ width: targetWidth })).toBuffer();
        await writeFile(join(OUT_DIR, `${base}-${targetWidth}.${ext}`), buffer);
        outputBytes += buffer.byteLength;
      }
    }

    manifest[key] = widths;
    console.log(`  ${key.padEnd(62)} ${width}px -> ${widths.join(', ')}  (was ${mb(size)})`);
  }

  const entries = Object.entries(manifest)
    .map(([key, widths]) => `  '${key}': [${widths.join(', ')}],`)
    .join('\n');

  await writeFile(
    MANIFEST,
    `// GENERATED by scripts/optimize-screenshots.mjs — do not edit by hand.\n` +
      `//\n` +
      `// Which widths exist under public/assets/thumbs for each release master.\n` +
      `// Every master is listed: the v1-2-0 ones are not published, so a missing\n` +
      `// entry would send getReleaseImageSources to a URL that 404s.\n` +
      `export const RELEASE_IMAGE_WIDTHS = {\n${entries}\n};\n`,
    'utf8'
  );

  const variants = Object.values(manifest).reduce(
    (total, widths) => total + widths.length * FORMATS.length,
    0
  );

  console.log(
    `\n${Object.keys(manifest).length} masters optimised.` +
      `\n${variants} variants, ${mb(outputBytes)} total (masters: ${mb(sourceBytes)}).` +
      `\nAverage variant: ${kb(outputBytes / variants)}.`
  );
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
