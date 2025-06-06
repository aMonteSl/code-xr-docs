import { useState, useEffect } from 'react';
import { getExtensionStats } from '../utils/marketplaceAPI';

export const useExtensionStats = () => {
  const [stats, setStats] = useState({
    downloads: null, // null en lugar de números ficticios
    installs: null,
    rating: null,
    ratingCount: null,
    version: null, // ✨ CAMBIAR A NULL TAMBIÉN
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🚀 Iniciando fetch con depuración de versión...');
        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        const data = await getExtensionStats();
        
        if (data && !data.error) {
          console.log('✅ Datos recibidos del método exacto:', data);
          console.log('🏷️ Versión recibida en hook:', data.version, '(tipo:', typeof data.version, ')');
          
          const newStats = {
            // Solo usar datos reales de la API, mantener null si no hay datos válidos
            downloads: (data.downloads && data.downloads > 0) ? data.downloads : null,
            installs: (data.installs && data.installs > 0) ? data.installs : null,
            rating: (data.rating && data.rating > 0) ? Math.round(data.rating * 10) / 10 : null,
            ratingCount: (data.ratingCount && data.ratingCount > 0) ? data.ratingCount : null,
            version: data.version || null, // ✨ NULL SI NO HAY VERSIÓN
            loading: false,
            error: null
          };

          console.log('📈 Stats finales aplicadas:', newStats);
          console.log('🔍 Comparación detallada:');
          console.log(`  Downloads: ${stats.downloads} → ${newStats.downloads}`);
          console.log(`  Installs: ${stats.installs} → ${newStats.installs}`);
          console.log(`  Rating: ${stats.rating} → ${newStats.rating}`);
          console.log(`  Version: "${stats.version}" → "${newStats.version}"`);
          
          setStats(newStats);
        } else {
          console.warn('⚠️ Error en datos o sin datos, manteniendo valores null');
          setStats(prev => ({ 
            ...prev, 
            loading: false,
            error: data?.error || 'No data received'
          }));
        }
      } catch (error) {
        console.error('💥 Error en hook:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load stats'
        }));
      }
    };

    fetchStats();
    
    // Actualizar cada 10 minutos
    const interval = setInterval(fetchStats, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return stats;
};