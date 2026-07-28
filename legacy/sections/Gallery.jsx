import React, { useMemo, useState } from 'react';
import { ExternalLink, ImageIcon, Play } from 'lucide-react';
import AutoplayVideoPreview from '../components/AutoplayVideoPreview';
import MediaLightbox from '../components/MediaLightbox';
import { galleryCategoryOrder, galleryMedia } from '../content/releaseContent';
import { getAssetPath } from '../utils/assets';

const handleCardKeyDown = (event, callback) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState(null);

  const categories = useMemo(() => ['All', ...galleryCategoryOrder], []);

  const organizedByCategory = useMemo(
    () =>
      galleryCategoryOrder.map((category) => ({
        category,
        items: galleryMedia.filter((item) => item.category === category),
      })),
    []
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') {
      return galleryMedia;
    }

    return galleryMedia.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="gallery" className="relative overflow-hidden bg-transparent py-20">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-purple-400/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-neon-blue/5 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            <span className="text-white">Experience</span>{' '}
            <span className="text-gradient bg-linear-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
              Code-XR
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-300">
            Browse the new v1.1.0 media first, then move through the complete archive of Code-XR
            tutorials, analysis workflows, and immersive demos.
          </p>
        </div>

        <div
          className="mb-12 flex flex-wrap justify-center gap-4"
          data-aos="fade-up"
          data-aos-delay="150"
        >
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-6 py-3 font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-neon-blue text-black glow-blue'
                  : 'glass-card text-gray-300 hover:border-neon-blue/50 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {activeCategory === 'All' ? (
          <div className="space-y-16">
            {organizedByCategory.map(
              ({ category, items }) =>
                items.length > 0 && (
                  <div key={category}>
                    <div className="mb-8" data-aos="fade-up">
                      <h3 className="mb-2 text-2xl font-bold text-white">{category}</h3>
                      <div className="h-1 w-20 rounded-sm bg-linear-to-r from-neon-blue to-purple-400"></div>
                    </div>

                    <div
                      className={`grid gap-8 ${
                        items.length === 1
                          ? 'mx-auto max-w-md grid-cols-1'
                          : items.length === 2
                          ? 'mx-auto max-w-4xl grid-cols-1 md:grid-cols-2'
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}
                    >
                      {items.map((item, index) => (
                        <article
                          key={item.id}
                          className="glass-card-hover group overflow-hidden text-left"
                          style={{ animationDelay: `${index * 100}ms` }}
                          data-aos="fade-up"
                          data-aos-delay={index * 100}
                          onClick={() => setSelectedMedia(item)}
                          onKeyDown={(event) => handleCardKeyDown(event, () => setSelectedMedia(item))}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="relative overflow-hidden">
                            {item.type === 'video' ? (
                              <AutoplayVideoPreview
                                videoUrl={item.videoUrl}
                                title={item.title}
                                mediaLabel={item.mediaLabel || item.category}
                                className="aspect-16/10 w-full sm:aspect-video"
                              />
                            ) : (
                              <img
                                src={getAssetPath(item.imagePath)}
                                alt={item.title}
                                className="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-video"
                                loading="lazy"
                              />
                            )}
                            <div
                              className={`absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                                item.type === 'video' ? 'pointer-events-none' : ''
                              }`}
                            >
                              <div className="rounded-full bg-neon-blue p-4 text-black shadow-[0_0_30px_rgba(0,170,255,0.45)]">
                                {item.type === 'video' ? <Play size={22} /> : <ImageIcon size={22} />}
                              </div>
                            </div>
                            <div className="absolute left-4 top-4">
                              <span className="rounded-full bg-black/70 px-3 py-1 text-sm text-neon-blue backdrop-blur-sm">
                                {item.mediaLabel || item.category}
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="mb-3 text-xl font-bold text-white transition-colors duration-300 group-hover:text-neon-blue">
                              {item.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-300">{item.description}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item, index) => (
              <article
                key={item.id}
                className="glass-card-hover group overflow-hidden text-left"
                style={{ animationDelay: `${index * 100}ms` }}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                onClick={() => setSelectedMedia(item)}
                onKeyDown={(event) => handleCardKeyDown(event, () => setSelectedMedia(item))}
                role="button"
                tabIndex={0}
              >
                <div className="relative overflow-hidden">
                  {item.type === 'video' ? (
                    <AutoplayVideoPreview
                      videoUrl={item.videoUrl}
                      title={item.title}
                      mediaLabel={item.mediaLabel || item.category}
                      className="aspect-16/10 w-full sm:aspect-video"
                    />
                  ) : (
                    <img
                      src={getAssetPath(item.imagePath)}
                      alt={item.title}
                      className="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-video"
                      loading="lazy"
                    />
                  )}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                      item.type === 'video' ? 'pointer-events-none' : ''
                    }`}
                  >
                    <div className="rounded-full bg-neon-blue p-4 text-black shadow-[0_0_30px_rgba(0,170,255,0.45)]">
                      {item.type === 'video' ? <Play size={22} /> : <ImageIcon size={22} />}
                    </div>
                  </div>
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-sm text-neon-blue backdrop-blur-sm">
                      {item.mediaLabel || item.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="mb-3 text-xl font-bold text-white transition-colors duration-300 group-hover:text-neon-blue">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-300">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-16 text-center" data-aos="fade-up" data-aos-delay="600">
          <div className="glass-card mx-auto max-w-2xl p-8">
            <h3 className="mb-4 text-2xl font-bold text-white">Ready to experience Code-XR?</h3>
            <p className="mb-6 text-gray-300">
              Install the extension and move from the release media into the full immersive
              workflow inside VS Code.
            </p>
            <a
              href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <ExternalLink size={20} />
              <span>Install Code-XR</span>
            </a>
          </div>
        </div>
      </div>

      <MediaLightbox item={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </section>
  );
};

export default Gallery;
