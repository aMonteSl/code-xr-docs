import React from 'react';
import { ExternalLink, ImageIcon, Play, X } from 'lucide-react';
import { getAssetPath } from '../utils/assets';
import { getYouTubeId } from '../utils/media';

const MediaLightbox = ({ item, onClose }) => {
  if (!item) {
    return null;
  }

  const externalUrl =
    item.type === 'video' ? item.videoUrl : getAssetPath(item.imagePath);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-card my-auto w-full max-w-5xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neon-blue">
              {item.type === 'video' ? <Play size={12} /> : <ImageIcon size={12} />}
              <span>{item.mediaLabel || (item.type === 'video' ? 'Video' : 'Image')}</span>
            </div>
            <h3 className="pr-2 text-lg font-bold text-white sm:text-xl">{item.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-gray-400 transition-colors hover:text-white"
            aria-label="Close media preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-80px)] space-y-5 overflow-y-auto p-4 sm:p-5">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
            {item.type === 'video' ? (
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(item.videoUrl)}?autoplay=1`}
                  title={`${item.title} full video preview`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={getAssetPath(item.imagePath)}
                alt={item.title}
                className="max-h-[65vh] w-full object-contain"
              />
            )}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-3xl text-sm leading-relaxed text-gray-300">{item.description}</p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex w-full items-center justify-center space-x-2 sm:w-auto"
            >
              <ExternalLink size={16} />
              <span>Open original</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLightbox;
