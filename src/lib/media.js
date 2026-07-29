// YouTube helpers. Ported from the legacy site, reduced to what the new site
// actually needs: the videos are referenced by id in content/, and only the
// watch URL is built here so no component hardcodes a YouTube domain.
export const getYouTubeWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

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

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
};
