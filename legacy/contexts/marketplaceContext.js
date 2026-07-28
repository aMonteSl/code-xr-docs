import { createContext } from 'react';

export const defaultMarketplaceData = {
  activeInstalls: '-',
  marketplaceDownloads: '-',
  approxTotalDownloads: null,
  tillDateAcquisition: null,
  rating: '-',
  ratingCount: '-',
  version: '-',
  lastUpdated: '-',
  loading: true,
  sourceLabels: {
    activeInstalls: 'Active installs',
    marketplaceDownloads: 'Marketplace downloads',
    approxTotalDownloads: 'Approx. total downloads',
    rating: 'Marketplace rating',
    version: 'Latest published version',
    lastUpdated: 'Published',
  },
};

export const MarketplaceContext = createContext(defaultMarketplaceData);
