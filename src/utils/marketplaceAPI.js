const PLUGIN_ID = 'aMonteSl.code-xr';

// Función principal para obtener métricas del plugin Code-XR
async function obtenerMetricasCodeXR() {
  const url = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=3.0-preview.1';

  // Body de la petición, filtrando por "aMonteSl.code-xr" y pidiendo estadísticas (flags = 256)
  const body = {
    filters: [
      {
        criteria: [
          {
            filterType: 7,
            value: PLUGIN_ID
          }
        ],
        pageNumber: 1,
        pageSize: 1
      }
    ],
    flags: 769
  };

  console.log('🔍 Realizando petición exacta a la API para plugin:', PLUGIN_ID);
  console.log('📋 Body de la petición:', JSON.stringify(body, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json;api-version=3.0-preview.1'
    },
    body: JSON.stringify(body)
  });

  console.log('📡 Respuesta HTTP status:', response.status);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('📊 Datos completos de la API:', data);
  
  const ext = data.results[0]?.extensions[0];
  if (!ext) {
    throw new Error('Plugin no encontrado en la respuesta de la API');
  }

  console.log('✅ Plugin encontrado:', ext.extensionName);
  console.log('📈 Estadísticas raw:', ext.statistics);

  // 🔍 DEPURACIÓN ESPECÍFICA DE VERSIONES
  console.log('🏷️ DEPURACIÓN DE VERSIONES:');
  console.log('📦 ¿Existe ext.versions?', !!ext.versions);
  console.log('📦 Tipo de ext.versions:', typeof ext.versions);
  console.log('📦 Es array ext.versions?', Array.isArray(ext.versions));
  
  if (ext.versions) {
    console.log('📦 Longitud del array versions:', ext.versions.length);
    console.log('📦 TODAS las versiones disponibles:', ext.versions);
    
    // Mostrar las primeras 3 versiones con detalle
    ext.versions.slice(0, 3).forEach((version, index) => {
      console.log(`📦 Versión ${index}:`, {
        version: version.version,
        lastUpdated: version.lastUpdated,
        properties: version.properties,
        assetUri: version.assetUri,
        fallbackAssetUri: version.fallbackAssetUri
      });
    });
  } else {
    console.log('❌ ext.versions NO existe');
  }

  // Intentar obtener versión de múltiples formas
  let latestVersion = null;
  
  // Método 1: Primer elemento del array versions
  if (ext.versions && Array.isArray(ext.versions) && ext.versions.length > 0) {
    latestVersion = ext.versions[0].version;
    console.log('✅ Método 1 - Versión desde versions[0]:', latestVersion);
  }
  
  // Método 2: Buscar en displayName o extensionName
  if (!latestVersion && ext.displayName) {
    const versionMatch = ext.displayName.match(/v?(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      latestVersion = versionMatch[1];
      console.log('✅ Método 2 - Versión desde displayName:', latestVersion);
    }
  }
  
  // Método 3: Buscar en properties
  if (!latestVersion && ext.versions && ext.versions[0]?.properties) {
    for (const prop of ext.versions[0].properties) {
      if (prop.key === 'Microsoft.VisualStudio.Code.Engine' || 
          prop.key === 'version' || 
          prop.key.toLowerCase().includes('version')) {
        console.log(`🔍 Propiedad encontrada: ${prop.key} = ${prop.value}`);
        const versionMatch = prop.value.match(/v?(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          latestVersion = versionMatch[1];
          console.log('✅ Método 3 - Versión desde properties:', latestVersion);
          break;
        }
      }
    }
  }
  
  // Método 4: Buscar en manifestVersion (si existe)
  if (!latestVersion && ext.versions && ext.versions[0]?.manifestVersion) {
    latestVersion = ext.versions[0].manifestVersion;
    console.log('✅ Método 4 - Versión desde manifestVersion:', latestVersion);
  }

  console.log('🏷️ VERSIÓN FINAL DETERMINADA:', latestVersion || 'NO ENCONTRADA');

  // Normalizar estadísticas a un objeto para extraer valores fácilmente
  const statsObj = {};
  for (const s of ext.statistics || []) {
    statsObj[s.statisticName] = s.value;
    console.log(`📊 Estadística: "${s.statisticName}" = ${s.value} (tipo: ${typeof s.value})`);
  }

  console.log('🗺️ Objeto de estadísticas normalizado:', statsObj);

  // BÚSQUEDA MEJORADA - Buscar con múltiples nombres posibles
  const findStatValue = (possibleNames, logPrefix) => {
    console.log(`🔍 ${logPrefix} - Buscando entre:`, possibleNames);
    
    for (const name of possibleNames) {
      // Buscar exact match
      if (statsObj[name] !== undefined && statsObj[name] !== null) {
        console.log(`✅ ${logPrefix} - Encontrado con "${name}": ${statsObj[name]}`);
        return Number(statsObj[name]);
      }
      
      // Buscar case-insensitive
      const lowerName = name.toLowerCase();
      for (const [key, value] of Object.entries(statsObj)) {
        if (key.toLowerCase() === lowerName && value !== undefined && value !== null) {
          console.log(`✅ ${logPrefix} - Encontrado case-insensitive "${key}": ${value}`);
          return Number(value);
        }
      }
    }
    
    console.log(`❌ ${logPrefix} - No encontrado en ninguna variante`);
    return null;
  };

  // Buscar downloads/instalaciones totales
  const totalDescargas = findStatValue([
    'downloads', 'download', 'downloadCount', 'totalDownloads',
    'install', 'installs', 'installCount', 'totalInstalls',
    'cumulativeInstalls', 'allTimeInstalls'
  ], 'DOWNLOADS');

  // Buscar instalaciones activas (esto ya funciona)
  const totalInstalaciones = findStatValue([
    'install', 'installs', 'installCount', 'activeInstalls',
    'currentInstalls', 'liveInstalls'
  ], 'ACTIVE INSTALLS');

  // Buscar rating promedio
  const promedioRating = findStatValue([
    'averageRating', 'averagerating', 'rating', 'averageScore',
    'score', 'ratingAverage'
  ], 'RATING');

  // Buscar total de valoraciones
  const totalValoraciones = findStatValue([
    'ratingCount', 'ratingcount', 'reviewCount', 'reviewcount',
    'ratingsCount', 'totalRatings', 'totalReviews'
  ], 'RATING COUNT');

  const result = {
    totalInstalaciones: totalInstalaciones,
    promedioRating: promedioRating,
    totalValoraciones: totalValoraciones,
    totalDescargas: totalDescargas,
    version: latestVersion
  };

  console.log('📈 Métricas finales del plugin extraídas:', result);
  return result;
}

// Función de adaptación para mantener compatibilidad con el hook existente
export const getPluginStats = async () => {
  try {
    const metrics = await obtenerMetricasCodeXR();
    
    return {
      downloads: metrics.totalDescargas,
      installs: metrics.totalInstalaciones,
      rating: metrics.promedioRating,
      ratingCount: metrics.totalValoraciones,
      version: metrics.version,
      error: null
    };
  } catch (error) {
    console.error('Error fetching plugin stats:', error);
    return {
      downloads: null,
      installs: null,
      rating: null,
      ratingCount: null,
      version: null,
      error: error.message
    };
  }
};

// ✨ MANTENER: Alias para compatibilidad
export const getExtensionStats = getPluginStats;

// Exportar también la función original por si la necesitas
export { obtenerMetricasCodeXR };

// Método de fallback (mantener por si acaso)
export const getStatsFromWebPage = async () => {
  try {
    console.log('🌐 Método de fallback: scraping web...');
    
    const response = await fetch(
      `https://marketplace.visualstudio.com/items?itemName=${PLUGIN_ID}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    const html = await response.text();
    console.log('📄 HTML obtenido para fallback, longitud:', html.length);

    // Patrones básicos para fallback
    const downloadMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*(?:downloads?|installs?)/i);
    const installMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*(?:active|current)\s*(?:installs?|users?)/i);

    const downloads = downloadMatch ? parseInt(downloadMatch[1].replace(/,/g, '')) : null;
    const installs = installMatch ? parseInt(installMatch[1].replace(/,/g, '')) : null;

    console.log('📊 Resultados del fallback web scraping:', { downloads, installs });

    return {
      downloads: downloads,
      installs: installs,
      source: 'web-scraping-fallback'
    };

  } catch (error) {
    console.error('💥 Error en fallback web scraping:', error);
    return null;
  }
};