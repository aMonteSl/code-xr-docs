import React, { useEffect, useMemo, useState } from 'react';
import { MarketplaceContext, defaultMarketplaceData } from './marketplaceContext';

const formatCount = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('en-US');
};

export const MarketplaceProvider = ({ children }) => {
  const [data, setData] = useState(defaultMarketplaceData);

  useEffect(() => {
    let isMounted = true;

    const fetchMarketplaceData = async () => {
      try {
        const response = await fetch(
          'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json;api-version=3.0-preview.1',
            },
            body: JSON.stringify({
              assetTypes: ['Microsoft.VisualStudio.Services.Icons.Default'],
              filters: [
                {
                  criteria: [
                    {
                      filterType: 7,
                      value: 'aMonteSl.code-xr',
                    },
                  ],
                  pageNumber: 1,
                  pageSize: 1,
                  sortBy: 0,
                  sortOrder: 0,
                },
              ],
              flags: 914,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Marketplace request failed with status ${response.status}`);
        }

        const result = await response.json();
        const extension = result.results?.[0]?.extensions?.[0];

        if (!extension) {
          throw new Error('Marketplace extension payload not found.');
        }

        const statistics = extension.statistics || [];
        const activeInstalls = statistics.find((stat) => stat.statisticName === 'install')?.value;
        const marketplaceDownloads = statistics.find(
          (stat) => stat.statisticName === 'downloadCount'
        )?.value;
        const approxTotalDownloads =
          typeof activeInstalls === 'number' && typeof marketplaceDownloads === 'number'
            ? activeInstalls + marketplaceDownloads
            : null;
        const rating = statistics.find((stat) => stat.statisticName === 'averagerating')?.value;
        const ratingCount = statistics.find((stat) => stat.statisticName === 'ratingcount')?.value;
        const latestVersion = extension.versions?.[0];

        if (isMounted) {
          setData({
            activeInstalls: formatCount(activeInstalls),
            marketplaceDownloads: formatCount(marketplaceDownloads),
            approxTotalDownloads:
              approxTotalDownloads === null ? null : formatCount(approxTotalDownloads),
            tillDateAcquisition: null,
            rating: typeof rating === 'number' ? rating.toFixed(1) : '-',
            ratingCount: formatCount(ratingCount),
            version: latestVersion?.version ? `v${latestVersion.version}` : '-',
            lastUpdated: latestVersion?.lastUpdated || '-',
            loading: false,
            sourceLabels: defaultMarketplaceData.sourceLabels,
          });
        }
      } catch (error) {
        console.error('Unable to load official marketplace data.', error);

        if (isMounted) {
          setData({
            ...defaultMarketplaceData,
            loading: false,
          });
        }
      }
    };

    fetchMarketplaceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => data, [data]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
};
