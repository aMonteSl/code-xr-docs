import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { getYouTubeId, getYouTubeThumbnail } from '../utils/media';

const buildPreviewUrl = (videoUrl) => {
  const videoId = getYouTubeId(videoUrl);

  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: videoId,
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

const AutoplayVideoPreview = ({ videoUrl, title, mediaLabel, className = '' }) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const previewUrl = useMemo(() => buildPreviewUrl(videoUrl), [videoUrl]);
  const posterUrl = useMemo(() => getYouTubeThumbnail(videoUrl), [videoUrl]);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '180px 0px',
        threshold: 0.2,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsLoaded(false);
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-950/90 ${className}`}
      aria-hidden="true"
    >
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
      ) : null}

      <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-black/10" />

      {previewUrl && isVisible ? (
        <iframe
          className={`pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          src={previewUrl}
          title={`${title} autoplay preview`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsLoaded(true)}
        />
      ) : null}

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`rounded-full border border-white/10 bg-black/55 p-4 text-neon-blue shadow-[0_0_24px_rgba(0,170,255,0.2)] transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Play size={24} />
        </div>
      </div>

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neon-blue backdrop-blur-sm">
        <span>{mediaLabel || 'Video preview'}</span>
        <span className="text-gray-400">Autoplay</span>
      </div>
    </div>
  );
};

export default AutoplayVideoPreview;
