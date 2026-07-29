import { useEffect, useState } from 'react';
import { fetchMarketplaceStats, readCachedStats, writeCachedStats } from '@/lib/marketplace';

// Live Marketplace figures. Returns { status, stats } where status is
// 'loading' | 'ready' | 'error'.
//
// There is deliberately no Context provider: only one section consumes this
// today, and the cross-consumer request dedup a provider would buy is already
// handled better by the module-level in-flight promise in lib/marketplace.js —
// which also fixes the StrictMode double-fetch that the legacy provider did
// not.
export const useMarketplaceStats = () => {
  // Read the cache synchronously so a returning visitor sees real numbers in
  // the first paint, with no skeleton flash.
  const [state, setState] = useState(() => {
    const cached = readCachedStats();

    return cached
      ? { status: 'ready', stats: cached.stats }
      : { status: 'loading', stats: null };
  });

  useEffect(() => {
    const cached = readCachedStats();

    // Fresh cache: nothing to do. A stale one still seeded the state above, so
    // the refetch below is a silent background revalidation.
    if (cached && !cached.isStale) {
      return undefined;
    }

    // This controller does NOT abort the request — the promise is shared
    // across consumers via lib/marketplace.js, so aborting on one unmount
    // would break the others. Its only job is to drop the setState after
    // unmount. The real network timeout is AbortSignal.timeout() in the lib.
    const controller = new AbortController();

    fetchMarketplaceStats()
      .then((stats) => {
        writeCachedStats(stats);

        if (!controller.signal.aborted) {
          setState({ status: 'ready', stats });
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          // Only in dev: a visitor behind a corporate proxy or a privacy
          // extension should not get red console noise on a marketing page.
          console.warn('Live Marketplace stats unavailable.', error);
        }

        // A stale cache is better than nothing — keep showing it.
        if (!controller.signal.aborted && !cached) {
          setState({ status: 'error', stats: null });
        }
      });

    return () => controller.abort();
  }, []);

  return state;
};
