import { Code2, Globe, GraduationCap, Mail, MapPin, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import GithubIcon from '@/components/ui/GithubIcon';
import LinkedinIcon from '@/components/ui/LinkedinIcon';
import { author } from '@/content/authorContent';
import { site } from '@/content/siteContent';
import { getProfileImage, getProfileSrcSet } from '@/lib/assets';
import FeedbackAsk from '@/sections/author/FeedbackAsk';

const ICONS = {
  graduation: GraduationCap,
  code: Code2,
  pin: MapPin,
  sparkle: Sparkles,
  github: GithubIcon,
  linkedin: LinkedinIcon,
  globe: Globe,
  mail: Mail,
};

// Who built it, in the layout the previous site used: portrait beside the bio
// in one card, three short cards under it.
//
// The portrait keeps its circle but not its decoration: the old one stacked
// two rings, one of them pulsing, over a blue-to-purple gradient halo. Rings
// that pulse and coloured glows are the two things this palette rules out, so
// the frame is a plain edge ring.
//
// This band also closes the page, so it carries the site's closing ask
// (FeedbackAsk at the bottom, #feedback). That is a deliberate lodging, not an
// overflow: the navbar has no room for a twelfth entry and the ask reads
// honestly only after the bio it follows. The full argument, and the reason it
// is not called "support", is in FeedbackAsk's own header.
const Author = () => {
  return (
    <section id="author" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {author.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {author.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {author.intro}
          </p>
        </div>

        <div className="@container mt-10 rounded-card border border-edge bg-surface-raised p-6 shadow-card sm:p-8">
          <div className="flex flex-col items-center gap-8 text-center @2xl:flex-row @2xl:items-start @2xl:text-left">
            <img
              src={getProfileImage('medium')}
              srcSet={getProfileSrcSet()}
              sizes="(min-width: 1024px) 14rem, 12rem"
              alt={author.portraitAlt}
              width="512"
              height="512"
              loading="lazy"
              decoding="async"
              className="size-48 shrink-0 rounded-full border border-edge object-cover shadow-card lg:size-56"
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl">
                {author.name}
              </h3>

              <div className="mt-4 flex flex-wrap justify-center gap-2 @2xl:justify-start">
                {author.chips.map((chip) => {
                  const Icon = ICONS[chip.icon];

                  return (
                    <span
                      key={chip.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3 py-1 text-xs font-semibold text-ink-muted"
                    >
                      {Icon ? <Icon aria-hidden="true" className="size-3.5 text-accent" /> : null}
                      {chip.label}
                    </span>
                  );
                })}
              </div>

              <div className="mt-5 space-y-4">
                {author.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm text-pretty text-ink-muted hyphens-auto @2xl:text-justify sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap @2xl:justify-start">
                {author.actions.map((action) => {
                  const Icon = ICONS[action.icon];
                  const href = site.links[action.linkKey];
                  const isMail = href.startsWith('mailto:');

                  return (
                    <Button
                      key={action.id}
                      href={href}
                      variant={action.primary ? 'primary' : 'secondary'}
                      className="px-5 py-2.5 text-sm"
                      {...(isMail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Same ramp as Academic's resources: 2-up from sm, 3-up from lg,
            last card spanning the 2-up row — the straight 1→3 jump at md gave
            each highlight 224px at 768. */}
        <div className="stagger-cards mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {author.highlights.map((highlight) => {
            const Icon = ICONS[highlight.icon];

            return (
              <div
                key={highlight.id}
                className="rounded-card border border-edge bg-surface-raised p-5 text-center shadow-card sm:last:col-span-2 lg:last:col-span-1"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto flex size-11 items-center justify-center rounded-full border border-edge bg-surface text-accent"
                >
                  {Icon ? <Icon className="size-5" /> : null}
                </span>
                <h4 className="mt-4 text-base font-bold tracking-tight text-ink">
                  {highlight.title}
                </h4>
                <p className="mt-2 text-sm text-pretty text-ink-muted">{highlight.body}</p>
              </div>
            );
          })}
        </div>

        {/* Inside the Container (so it gets the gutters and the section's own
            scroll reveal) but OUTSIDE the stagger grid, on purpose. That grid's
            children carry `animation-fill-mode: both`, which pins
            `transform: none` on them forever — see the .stagger-cards note in
            main.css. A SIBLING of the grid keeps the plain section reveal and
            stays free of that constraint. */}
        <FeedbackAsk />
      </Container>
    </section>
  );
};

export default Author;
