import { Award, BarChart3, Download, Star, Tag, TrendingUp } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { award } from '@/content/awardContent';
import { hero } from '@/content/heroContent';
import { site } from '@/content/siteContent';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCount, formatPublishedDate } from '@/lib/marketplace';

// The fact strip: four live Marketplace metrics plus two identity cards — the
// version now live and the VISSOFT recognition. Section-private: it owns the
// responsive grid and decides which cards exist at all.
//
// On the "Approx. total downloads" figure — READ BEFORE "FIXING" IT:
// it is `install + downloadCount`, carried over from the previous version of
// the site at the site owner's request. The two are independent counters and
// the sum is NOT a metric the Marketplace publishes, which is exactly why the
// label says "Approx.". The documented convention for a defensible total is
// `install + updateCount`. Do not silently switch the formula — it is a
// deliberate product decision, not an oversight.
const HeroStats = ({ status, stats }) => {
  // A fixed number of hook calls regardless of which cards render.
  const installs = useCountUp(stats?.installs);
  const downloads = useCountUp(stats?.downloads);
  const approxTotal = useCountUp(
    typeof stats?.installs === 'number' && typeof stats?.downloads === 'number'
      ? stats.installs + stats.downloads
      : undefined
  );

  const isLoading = status === 'loading';
  const hasReviews = typeof stats?.ratingCount === 'number' && stats.ratingCount > 0;

  // These two never skeleton: the version has a committed fallback and the
  // award is entirely static, so they also survive a failed fetch.
  const versionCard = {
    id: 'version',
    icon: Tag,
    value: stats?.version ?? site.version,
    label: hero.stats.version.label,
    detail: formatPublishedDate(stats?.lastUpdated) ?? hero.stats.version.fallbackDetail,
  };

  const awardCard = {
    id: 'award',
    icon: Award,
    value: String(award.year),
    label: award.name,
    detail: award.venue,
    href: award.links.officialAwards,
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': `${award.name} at ${award.conference} — ${hero.stats.award.linkHint}`,
  };

  let cards;

  if (status === 'error') {
    // The metrics are unreachable; showing dashes would read as a bug. The
    // two static cards still carry the row.
    cards = [awardCard, versionCard];
  } else {
    cards = [
      {
        id: 'installs',
        icon: Download,
        value: formatCount(installs),
        isLoading,
        ...hero.stats.installs,
      },
      {
        // Linked: the figure invites the click that grows it.
        id: 'approx-total',
        icon: BarChart3,
        value: formatCount(approxTotal),
        isLoading,
        label: hero.stats.approxTotal.label,
        detail: hero.stats.approxTotal.detail,
        href: site.links.marketplace,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${hero.stats.approxTotal.label} — ${hero.stats.approxTotal.linkHint}`,
      },
      {
        id: 'downloads',
        icon: TrendingUp,
        value: formatCount(downloads),
        isLoading,
        ...hero.stats.downloads,
      },
    ];

    // While loading we optimistically reserve the rating slot. If it turns
    // out there are no reviews the card is dropped rather than showing a dash
    // or a fabricated score.
    if (isLoading || hasReviews) {
      cards.push({
        id: 'rating',
        icon: Star,
        // No count-up here: a 900ms ramp to "5.0" looks silly.
        value: typeof stats?.rating === 'number' ? `${stats.rating.toFixed(1)}★` : null,
        label: hero.stats.rating.label,
        detail: hasReviews ? hero.stats.rating.detail(stats.ratingCount) : null,
        isLoading,
      });
    }

    cards.push(awardCard, versionCard);
  }

  // Complete literal strings: Tailwind scans source text, so an interpolated
  // `grid-cols-${n}` would never be generated. Normal path is 6 cards
  // (2×3 mobile, 3×2 desktop); 5 when there are no reviews; 2 on fetch error.
  const widthClass = cards.length === 2 ? 'max-w-md' : 'max-w-5xl';
  const gridClass = 'grid grid-cols-2 gap-3 sm:gap-4';
  const columnsClass = cards.length === 2 ? '' : 'sm:grid-cols-3';

  return (
    <div className={`mx-auto mt-10 ${widthClass} ${gridClass} ${columnsClass}`}>
      {cards.map((card, index) => {
        const { id, isLoading: cardLoading = false, ...cardProps } = card;

        return (
          <StatCard
            key={id}
            isLoading={cardLoading}
            {...cardProps}
            // An odd last card spans both columns on mobile so the 2-up grid
            // reads as a deliberate arrangement rather than a broken row.
            className={
              cards.length % 2 === 1 && index === cards.length - 1
                ? 'col-span-2 sm:col-span-1'
                : ''
            }
          />
        );
      })}
    </div>
  );
};

export default HeroStats;
