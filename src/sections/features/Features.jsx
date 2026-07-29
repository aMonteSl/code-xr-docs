import { Check, Code2, Monitor, RefreshCw, Scale, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import Container from '@/components/ui/Container';
import { features } from '@/content/featuresContent';
import TechStrip from '@/sections/features/TechStrip';

// Icons live here, not in content: the content module stays plain data and
// never imports a component.
const ICONS = {
  shield: ShieldCheck,
  monitor: Monitor,
  code: Code2,
  refresh: RefreshCw,
  sliders: SlidersHorizontal,
  scale: Scale,
};

// The closing rational argument, after the gallery has done the showing. It
// deliberately does not re-list the four analyses — About introduces them and
// What's new develops each one. See featuresContent for where each claim comes
// from in the extension README.
const Features = () => {
  return (
    <section id="features" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {features.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {features.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {features.intro}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.properties.map((property) => {
            const Icon = ICONS[property.icon];

            return (
              <div
                key={property.id}
                className="@container rounded-card border border-edge bg-surface-raised p-5 shadow-card"
              >
                {Icon ? <Icon aria-hidden="true" className="size-5 text-accent" /> : null}
                <h3 className="mt-3 text-base font-bold tracking-tight text-ink">
                  {property.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify">
                  {property.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-card border border-edge bg-surface-raised p-5 shadow-card">
          <p className="text-lg font-semibold text-ink">{features.requirements.title}</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {features.requirements.items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-ink-muted">
                <Check aria-hidden="true" className="size-4 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <TechStrip
          title={features.stack.title}
          items={features.stack.items}
          linkHint={features.stack.linkHint}
        />
      </Container>
    </section>
  );
};

export default Features;
