// Live stats from the official VS Code Marketplace. No React in here — the
// hook layer (hooks/useMarketplaceStats.js) owns all the component wiring.
//
// The endpoint is public and unauthenticated, but a POST with a JSON
// Content-Type is CORS-preflighted: the OPTIONS has to pass too. Keep the
// header set to exactly these two — anything extra widens the preflight
// surface for no benefit.
//
// The extension id lives here rather than in content/ because lib/ sits at the
// bottom of the layering and may not import upward. content/siteContent.js
// carries the human-facing Marketplace URL for the same extension; the two
// change together.
export const MARKETPLACE_EXTENSION_ID = 'aMonteSl.code-xr';

const ENDPOINT = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';
const CACHE_KEY = 'codexr:marketplace:v1';
const FRESH_MS = 30 * 60 * 1000; // serve straight from cache
const HARD_MS = 7 * 24 * 60 * 60 * 1000; // older than this, ignore entirely
const REQUEST_TIMEOUT_MS = 8000;

// filterType 7 = ExtensionName. flags 914 asks for versions + statistics.
const FILTER_TYPE_EXTENSION_NAME = 7;
const FLAGS_VERSIONS_AND_STATISTICS = 914;

// One shared promise so React 19 StrictMode's double effect invocation — and
// any future second consumer — result in exactly one network request.
let inflight = null;

// Module-scope singletons: never construct a formatter per render.
const countFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export const formatCount = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? countFormatter.format(value) : null;

export const formatPublishedDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
};

const findStatistic = (statistics, name) =>
  statistics.find((statistic) => statistic.statisticName === name)?.value;

const isPreRelease = (version) =>
  version.properties?.some(
    (property) =>
      property.key === 'Microsoft.VisualStudio.Code.PreRelease' && property.value === 'true'
  ) ?? false;

// Returns raw numbers, not display strings. Formatting belongs to the view —
// pre-formatting here is what would rule out animating the counts.
const parseExtension = (payload) => {
  const extension = payload?.results?.[0]?.extensions?.[0];

  if (!extension) {
    throw new Error('Marketplace response contained no extension.');
  }

  const statistics = extension.statistics ?? [];
  const versions = extension.versions ?? [];

  // Never take versions[0] blindly: with these flags a published pre-release
  // sorts first, and the hero would advertise it as the live version.
  const latestStable = versions.find((version) => !isPreRelease(version)) ?? versions[0];

  return {
    installs: findStatistic(statistics, 'install') ?? null,
    downloads: findStatistic(statistics, 'downloadCount') ?? null,
    rating: findStatistic(statistics, 'averagerating') ?? null,
    ratingCount: findStatistic(statistics, 'ratingcount') ?? null,
    version: latestStable?.version ? `v${latestStable.version}` : null,
    lastUpdated: latestStable?.lastUpdated ?? null,
  };
};

const requestStats = async () => {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json;api-version=3.0-preview.1',
    },
    body: JSON.stringify({
      filters: [
        {
          criteria: [
            {
              filterType: FILTER_TYPE_EXTENSION_NAME,
              value: MARKETPLACE_EXTENSION_ID,
            },
          ],
          pageNumber: 1,
          pageSize: 1,
          sortBy: 0,
          sortOrder: 0,
        },
      ],
      flags: FLAGS_VERSIONS_AND_STATISTICS,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Marketplace request failed with status ${response.status}.`);
  }

  return parseExtension(await response.json());
};

export const fetchMarketplaceStats = () => {
  inflight ??= requestStats().finally(() => {
    inflight = null;
  });

  return inflight;
};

// sessionStorage access throws outright in Safari private mode, so every touch
// is guarded.
export const readCachedStats = () => {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);

    if (!raw) {
      return null;
    }

    const { stats, storedAt } = JSON.parse(raw);
    const age = Date.now() - storedAt;

    if (!stats || !Number.isFinite(age) || age > HARD_MS) {
      return null;
    }

    return { stats, isStale: age > FRESH_MS };
  } catch {
    return null;
  }
};

export const writeCachedStats = (stats) => {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ stats, storedAt: Date.now() }));
  } catch {
    // A full or unavailable quota is not worth failing the page over.
  }
};
