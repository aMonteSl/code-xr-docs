import { RELEASE_IMAGE_WIDTHS } from '@/lib/releaseImageWidths';

// Resolve public/ asset paths against the Vite base URL. Never reference
// public/ files with bare string paths from components.
export const getAssetPath = (path) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${cleanPath}`;
};

export const getReleaseAsset = (version, filename) =>
  getAssetPath(`assets/releases/${version}/${filename}`);

// Display variants of a release screenshot, produced by
// scripts/optimize-screenshots.mjs. The originals are 2x captures of up to
// 2.9 MB and are never what a card, carousel or lightbox should download.
const THUMB_FORMATS = ['avif', 'webp'];

const stripExtension = (filename) => filename.replace(/\.[^./]+$/, '');

const getReleaseThumb = (version, filename, width, format) =>
  getAssetPath(`assets/thumbs/${version}/${stripExtension(filename)}-${width}.${format}`);

// Everything a <picture> needs, ready to spread onto components/ui/Picture.
// A source with no variants (too small to be worth optimising) degrades to the
// original with an empty source list, which Picture renders as a plain <img>.
export const getReleaseImageSources = (version, filename) => {
  const widths = RELEASE_IMAGE_WIDTHS[`${version}/${filename}`];

  if (!widths) {
    return { src: getReleaseAsset(version, filename), sources: [] };
  }

  return {
    // The widest WebP, never the original: whatever fails to match a <source>
    // must still not end up pulling a multi-megabyte PNG.
    src: getReleaseThumb(version, filename, widths.at(-1), 'webp'),
    sources: THUMB_FORMATS.map((format) => ({
      type: `image/${format}`,
      srcSet: widths
        .map((width) => `${getReleaseThumb(version, filename, width, format)} ${width}w`)
        .join(', '),
    })),
  };
};

// The widest variant a master actually has, i.e. its own pixel width (capped by
// the ladder's top step). Callers use it to stop a small screenshot being
// stretched past its own pixels: `ui/new_server_configuration.png` is 366px
// wide, and a figure slot that assumed reading width painted it at 766, a 109%
// upscale that is simply blur. Returns null for a master with no variants, which
// getReleaseImageSources already degrades gracefully for.
export const getReleaseImageWidth = (version, filename) =>
  RELEASE_IMAGE_WIDTHS[`${version}/${filename}`]?.at(-1) ?? null;

export const getTechnologyAsset = (filename) =>
  getAssetPath(`assets/technologies/${filename}`);

export const getDocumentPath = (filename) => getAssetPath(`documents/${filename}`);

// The author portrait, committed at three square sizes, produced by
// scripts/optimize-profile-image.mjs from the master in assets-src/profile/.
// srcset lets the
// browser pick by its own density and slot width, which the previous site did
// with media queries pinned to viewport breakpoints instead.
const PROFILE_BASE = 'adrian-montes-linares';
const PROFILE_WIDTHS = { small: 256, medium: 512, large: 1024 };

export const getProfileImage = (size) => getAssetPath(`profile/${PROFILE_BASE}-${size}.jpg`);

export const getProfileSrcSet = () =>
  Object.entries(PROFILE_WIDTHS)
    .map(([size, width]) => `${getProfileImage(size)} ${width}w`)
    .join(', ');

// Responsive variants of the hero backdrop, produced by scripts/optimize-hero.mjs.
const HERO_IMAGE_WIDTHS = [640, 1024, 1672];

export const getHeroImage = (width, format) =>
  getAssetPath(`assets/hero/hero-${width}.${format}`);

export const getHeroSrcSet = (format) =>
  HERO_IMAGE_WIDTHS.map((width) => `${getHeroImage(width, format)} ${width}w`).join(', ');

// The hero render as a { src, sources } pair ready for Picture: the shared
// poster for videos with no still of their own (the gallery walkthroughs, the
// tested-projects demos). A real srcset, not a bare 640 — a ~630 CSS px
// gallery tile at DPR 2, or the ~1232px tested-projects player, were painting
// an upscaled 640. Same ladder the hero backdrop uses, so it is cache-warm.
export const getHeroImageSources = () => ({
  src: getHeroImage(640, 'webp'),
  sources: THUMB_FORMATS.map((format) => ({
    type: `image/${format}`,
    srcSet: getHeroSrcSet(format),
  })),
});
