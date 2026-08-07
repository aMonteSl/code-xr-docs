import { Download, ExternalLink, Package, Terminal } from 'lucide-react';
import Button from '@/components/ui/Button';
import CommandBlock from '@/components/ui/CommandBlock';
import { install } from '@/content/installContent';

// Icons stay in the section: the content module is plain data and never
// imports a component.
const ICONS = {
  package: Package,
  terminal: Terminal,
  download: Download,
};

// The three ways in, side by side. The recommended one is marked by an accent
// border, the filled chip and the primary button — never by a different hue.
//
// Its border stays 1px like every other card on the site: at 2px its content
// box started 1px lower and the call to action landed 1px below the others,
// which is visible when three buttons sit in a row.
//
// Cards stretch to the tallest of the row (items-stretch is the grid default)
// and push their call to action to the bottom with mt-auto, so the three
// buttons line up however long the descriptions run.
const InstallMethods = () => {
  const { methods } = install;

  return (
    <div>
      <h3 className="text-lg font-bold tracking-tight text-ink">{methods.title}</h3>

      {/* 2-up at md so 768-1023 is not a full-width single column: 344px per
          card is safe there because the commands scroll inside CommandBlock.
          The recommended method stays first; the VSIX card takes the whole
          2-up row instead of sitting orphaned. */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.items.map((method) => {
          const Icon = ICONS[method.icon];

          return (
            <div
              key={method.id}
              className={`@container flex flex-col rounded-card bg-surface-raised p-5 shadow-card md:last:col-span-2 lg:last:col-span-1 ${
                method.recommended ? 'border border-accent' : 'border border-edge'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface text-accent"
                >
                  {Icon ? <Icon className="size-5" /> : null}
                </span>
                <h4 className="flex-1 text-base font-bold tracking-tight text-ink">
                  {method.title}
                </h4>
                {method.recommended ? (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-on-accent uppercase">
                    {methods.recommended}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify">
                {method.description}
              </p>

              {method.command ? (
                <CommandBlock
                  command={method.command}
                  copyLabel={methods.copy}
                  copiedLabel={methods.copied}
                  className="mt-4"
                />
              ) : null}

              <ol className="mt-4 space-y-2">
                {method.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-edge text-[11px] font-bold tabular-nums text-ink"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-pretty">{step}</span>
                  </li>
                ))}
              </ol>

              {method.cta ? (
                <div className="mt-auto grid pt-5">
                  <Button
                    href={method.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant={method.recommended ? 'primary' : 'secondary'}
                  >
                    {method.cta.text}
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstallMethods;
