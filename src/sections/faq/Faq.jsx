import Container from '@/components/ui/Container';
import SectionLink from '@/components/ui/SectionLink';
import { faq } from '@/content/faqContent';
import { site } from '@/content/siteContent';

// The loose ends, in question form. Two jobs: answer "is it free" and "where
// do I report a bug", which nothing else on the page does, and put the
// qualifying facts into the shape a reader actually searches with.
//
// Plain headings and paragraphs, not a disclosure widget. An accordion would
// hide five of six answers from the DOM — the same trap the tested-projects
// accordion already falls into — and these are exactly the sentences that need
// to be crawlable and prerendered.
const Faq = () => {
  return (
    <section id="faq" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {faq.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {faq.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {faq.intro}
          </p>
        </div>

        <div className="stagger-cards-2 mt-8 grid gap-4 sm:mt-10 md:grid-cols-2">
          {faq.items.map((item) => (
            <div
              key={item.id}
              className="@container rounded-card border border-edge bg-surface-raised p-5 shadow-card"
            >
              <h3 className="text-base font-bold tracking-tight text-balance text-ink sm:text-lg">
                {item.question}
              </h3>
              <p className="mt-2 text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify">
                {item.answer}
              </p>

              {item.actionLabel ? (
                // up-right, not the default arrow: this one leaves the site,
                // and that is the site-wide distinction between the two icons.
                <SectionLink
                  href={site.links[item.actionLinkKey]}
                  icon="up-right"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4"
                >
                  {item.actionLabel}
                </SectionLink>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Faq;
