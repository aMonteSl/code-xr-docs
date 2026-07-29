// Dumb component: an <img> that can offer the browser better-encoded copies of
// itself. It knows nothing about releases or asset paths — the section resolves
// those (lib/assets.js getReleaseImageSources) and spreads the result here.
//
// `display: contents` on the <picture> is what makes this a drop-in replacement
// for a bare <img>. The wrapper would otherwise be an inline box between the
// image and its parent, which breaks every layout that styles the image as a
// flex child or sizes it against the parent (size-full, flex-1, max-h-full).
// With `contents` the picture generates no box at all and the <img> stays
// exactly the child it was. Source selection is unaffected: <source> elements
// are never rendered, and the browser resolves them at parse time.
//
// `sizes` goes on both the sources and the img: a <source> without it would
// fall back to the 100vw default and over-fetch on every slot narrower than
// the viewport, which is all of them.
const Picture = ({ src, sources = [], alt, sizes, className = '', ...imgProps }) => {
  return (
    <picture className="contents">
      {sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      <img src={src} alt={alt} sizes={sizes} className={className} {...imgProps} />
    </picture>
  );
};

export default Picture;
