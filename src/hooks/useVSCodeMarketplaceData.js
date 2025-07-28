import { useState, useEffect } from 'react';

const useVSCodeMarketplaceData = () => {
  const [data, setData] = useState({
    downloads: '-',
    activeInstalls: '-',
    rating: '-',
    version: '-',
    loading: true
  });

  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        // VS Code Marketplace API endpoint
        const response = await fetch(
          'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json;api-version=3.0-preview.1'
            },
            body: JSON.stringify({
              assetTypes: ['Microsoft.VisualStudio.Services.Icons.Default'],
              filters: [{
                criteria: [{
                  filterType: 7,
                  value: 'aMonteSl.code-xr'
                }],
                pageNumber: 1,
                pageSize: 1,
                sortBy: 0,
                sortOrder: 0
              }],
              flags: 914
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const extension = result.results?.[0]?.extensions?.[0];
          
          if (extension) {
            // Extract statistics
            const statistics = extension.statistics || [];
            const activeInstalls = statistics.find(s => s.statisticName === 'install')?.value || '-';
            const totalDownloads = statistics.find(s => s.statisticName === 'downloadCount')?.value || 
                                 statistics.find(s => s.statisticName === 'download')?.value || '-';
            const rating = extension.averagerating || 0;
            const version = extension.versions?.[0]?.version || '0.0.9';

            // Format numbers
            const formatNumber = (num) => {
              if (num === '-' || !num) return '-';
              if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
              if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
              return num.toString();
            };

            setData({
              downloads: formatNumber(totalDownloads),
              activeInstalls: formatNumber(activeInstalls),
              rating: rating > 0 ? rating.toFixed(1) : '5.0',
              version: `v${version}`,
              loading: false
            });
          } else {
            // Fallback to "-" values if extension not found
            setData({
              downloads: '-',
              activeInstalls: '-',
              rating: '-',
              version: '-',
              loading: false
            });
          }
        } else {
          // Fallback to "-" values if API call fails
          setData({
            downloads: '-',
            activeInstalls: '-',
            rating: '-',
            version: '-',
            loading: false
          });
        }
      } catch (error) {
        console.log('Using fallback data due to API error:', error);
        // Use fallback values - show "-" when no real data
        setData({
          downloads: '-',
          activeInstalls: '-',
          rating: '-',
          version: '-',
          loading: false
        });
      }
    };

    fetchMarketplaceData();
  }, []);

  return data;
};

export default useVSCodeMarketplaceData;
