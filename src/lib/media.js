// YouTube helpers. The videos are referenced by id in content/, and every
// YouTube URL on the site is built here so no component — and no build script —
// hardcodes a YouTube domain. scripts/prerender.mjs loads this module through
// Vite's SSR pipeline for the VideoObject JSON-LD; keep it free of browser
// globals.
export const getYouTubeWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

// The bare embed URL, with no playback parameters. This is what the JSON-LD
// declares to search engines; the iframe uses getYouTubeEmbedUrl below.
export const getYouTubeEmbedBaseUrl = (videoId) =>
  `https://www.youtube-nocookie.com/embed/${videoId}`;

// The poster YouTube generates for every upload, used as the VideoObject
// thumbnail so nothing has to be downloaded and committed here.
export const getYouTubeThumbnailUrl = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

// Embed URL for a silent, self-starting demo loop. Served from the
// privacy-enhanced domain, and only ever requested once the block is on
// screen — nothing external is fetched before that.
//
// autoplay needs mute to be honoured by browsers; playsinline stops iOS from
// going fullscreen; loop needs playlist set to the same id to work on a single
// video. Controls stay on so the visitor can unmute or seek.
export const getYouTubeEmbedUrl = (videoId) => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    rel: '0',
    modestbranding: '1',
  });

  return `${getYouTubeEmbedBaseUrl(videoId)}?${params}`;
};
