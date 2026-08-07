import CodeXrLogo from '@/components/ui/CodeXrLogo';
import Container from '@/components/ui/Container';
import GithubIcon from '@/components/ui/GithubIcon';
import { award } from '@/content/awardContent';
import { footer } from '@/content/footerContent';
import { site } from '@/content/siteContent';

// Single-row footer: brand, the important links, copyright. The hrefs are
// resolved here from siteContent/awardContent so no URL lives in two places.
const resolveHref = (link) => (link.award ? award.links.doi : site.links[link.linkKey]);

const Footer = () => {
  return (
    <footer className="border-t border-edge">
      {/* md:pb-24: from md up the footer is one row with the brand pinned to
          the left gutter — the only place the fixed FAB stops being a
          transient overlap (at page bottom it sits exactly over that corner).
          96px of bottom padding moves the row out of its zone. Below md the
          content is centered and clears it; below sm the FAB does not exist. */}
      <Container className="flex flex-col items-center gap-5 py-8 md:flex-row md:justify-between md:gap-6 md:pb-24">
        <div className="flex items-center gap-2">
          <CodeXrLogo className="size-5 text-ink" />
          <span className="font-semibold text-ink">{site.name}</span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {footer.links.map((link) => (
            <a
              key={link.id}
              href={resolveHref(link)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-muted transition-[color] duration-300 hover:text-ink motion-reduce:transition-none"
            >
              {link.icon === 'github' ? <GithubIcon aria-hidden="true" className="size-4" /> : null}
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-sm text-ink-muted">
          © {new Date().getFullYear()} {footer.copyrightName}
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
