// Generates the responsive variants of the hero background image.
//
// Source: assets-src/releases/v1-2-0/hero.png (1672x969, ~1.53 MB), the master
// outside public/. The About carousel also shows this render, but through the
// variants optimize-screenshots.mjs makes; these are the separate, wider set
// the hero section paints as its full-bleed backdrop.
//
// Run by hand (`npm run optimize:hero`) and commit the output, the same way
// scripts/optimize-profile-image.py works. It is deliberately NOT part of
// prebuild: sharp ships native binaries and CI has no reason to build them for
// an asset that changes once in a blue moon.
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'assets-src/releases/v1-2-0/hero.png');
const OUT_DIR = join(root, 'public/assets/hero');

// The source is 1672px wide; generating anything larger would just upscale.
const WIDTHS = [640, 1024, 1672];
const FORMATS = [
  { ext: 'avif', encode: (pipeline) => pipeline.avif({ quality: 55 }) },
  { ext: 'webp', encode: (pipeline) => pipeline.webp({ quality: 78 }) },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const run = async () => {
  // metadata() does not carry the byte size for a file input, so stat it.
  const { width, height } = await sharp(SOURCE).metadata();
  const { size } = await stat(SOURCE);
  console.log(`source: ${width}x${height}  ${kb(size)}`);

  await mkdir(OUT_DIR, { recursive: true });

  for (const targetWidth of WIDTHS) {
    for (const { ext, encode } of FORMATS) {
      const buffer = await encode(sharp(SOURCE).resize({ width: targetWidth })).toBuffer();
      const name = `hero-${targetWidth}.${ext}`;
      await writeFile(join(OUT_DIR, name), buffer);
      console.log(`  ${name.padEnd(18)} ${kb(buffer.byteLength)}`);
    }
  }

  const written = await readdir(OUT_DIR);
  console.log(`\n${written.length} files in public/assets/hero`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
