import React, { useState } from 'react';
import { ExternalLink, LoaderCircle } from 'lucide-react';

const DashboardPreview = ({ title, url }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/50">
      <div className="border-b border-white/10 p-4">
        <h4 className="mb-2 text-xl font-bold text-white">Interactive Dashboard Preview</h4>
        <p className="text-sm text-gray-300">
          Latest synced Code-XR export embedded directly in the site with its full runtime,
          textures, and assets.
        </p>
      </div>

      <div className="relative">
        <div className="aspect-[16/11] bg-slate-950 md:aspect-[4/3] xl:aspect-[16/10]">
          <iframe
            src={url}
            className="h-full w-full border-0"
            title={`${title} interactive Code-XR dashboard preview`}
            allow="fullscreen"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            aria-busy={!isLoaded}
            onLoad={() => setIsLoaded(true)}
          />
        </div>

        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-sm text-white">
              <LoaderCircle className="h-4 w-4 animate-spin text-neon-blue" />
              <span>Loading latest synced dashboard export</span>
            </div>
          </div>
        ) : null}

        <div className="absolute right-2 top-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 rounded-lg bg-black/70 p-2 text-xs text-white backdrop-blur-sm transition-colors duration-300 hover:bg-neon-blue/20"
            aria-label={`Open the full interactive Code-XR dashboard preview for ${title}`}
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open Full View</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
