// Generates the three square variants of the author portrait.
//
// Source: assets-src/profile/adrian-montes-linares.jpg, the master outside
// public/. The site only ever serves the variants (see getProfileImage and
// getProfileSrcSet in src/lib/assets.js), so the 1.35 MB master has no reason
// to be deployed.
//
// Run by hand (`npm run optimize:profile`) and commit the output, the same way
// scripts/optimize-hero.mjs works. Deliberately NOT part of prebuild: sharp
// ships native binaries and CI has no reason to build them for an asset that
// changes once in a blue moon.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'assets-src/profile/adrian-montes-linares.jpg');
const OUT_DIR = join(root, 'public/profile');
const BASENAME = 'adrian-montes-linares';

// Must match PROFILE_WIDTHS in src/lib/assets.js: the srcset is built from
// that map, so a size added here without a matching entry there is never
// requested, and vice versa a 404.
const SIZES = { small: 256, medium: 512, large: 1024 };

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const run = async () => {
  const { width, height } = await sharp(SOURCE).metadata();
  const { size } = await stat(SOURCE);
  console.log(`source: ${width}x${height}  ${kb(size)}`);

  // Square crop from the centre, biased a quarter up so the face stays in
  // frame on a portrait-orientation master (the previous script did the same).
  const side = Math.min(width, height);
  const left = Math.floor((width - side) / 2);
  const top = Math.floor((height - side) / 4);

  await mkdir(OUT_DIR, { recursive: true });

  for (const [suffix, target] of Object.entries(SIZES)) {
    const buffer = await sharp(SOURCE)
      .extract({ left, top, width: side, height: side })
      .resize(target, target, { kernel: 'lanczos3' })
      .sharpen({ sigma: 0.5 })
      .jpeg({ quality: 88, progressive: true, mozjpeg: true })
      .toBuffer();
    const name = `${BASENAME}-${suffix}.jpg`;
    await writeFile(join(OUT_DIR, name), buffer);
    console.log(`  ${name.padEnd(34)} ${target}x${target}  ${kb(buffer.byteLength)}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
