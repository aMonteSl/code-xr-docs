import Container from '@/components/ui/Container';

// The prose block of an analysis page: what the thing represents, what you can
// read off it, and what it is good for. Everything arrives as props.
//
// `paragraphs` is the explanation, `channels` is the "what drives what" list
// (the visual channels this analysis maps metrics onto), and `note` is the
// honest limitation — every analysis has one, and each page states it rather
// than leaving the reader to discover it.
const AnalysisOverview = ({ id, heading, paragraphs, channelsTitle, channels, note }) => {
  return (
    <section id={id} className="border-t border-edge py-12 sm:py-16">
      <Container>
        <div className="@container max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{heading}</h2>

          <div className="mt-4 space-y-4">
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base text-pretty text-ink-muted hyphens-auto @md:text-justify"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {channels?.length ? (
          <div className="mt-8">
            <h3 className="text-lg font-bold tracking-tight text-ink">{channelsTitle}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((channel) => (
                <li
                  key={channel.term}
                  className="flex gap-2.5 text-sm text-ink-muted"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {/* Sized flex item, or the text shrink-wraps and the bullet
                      drifts away from it on a wrap. */}
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-ink">{channel.term}</span>
                    {': '}
                    {channel.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {note ? (
          <p className="mx-auto mt-8 max-w-3xl rounded-card border border-edge bg-surface-raised p-4 text-sm text-pretty text-ink-muted shadow-card">
            <span className="font-semibold text-ink">{note.label}: </span>
            {note.body}
          </p>
        ) : null}
      </Container>
    </section>
  );
};

export default AnalysisOverview;
