import { useContext } from 'react';
import { MarketplaceContext } from '../contexts/marketplaceContext';

const useVSCodeMarketplaceData = () => useContext(MarketplaceContext);

export default useVSCodeMarketplaceData;
