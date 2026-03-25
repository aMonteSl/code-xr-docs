export const getYouTubeId = (url) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

export const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

export const getYouTubeWatchUrl = (url) => {
  const videoId = getYouTubeId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
};
