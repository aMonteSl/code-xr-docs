// Helper function to get correct asset paths for both development and production
export const getAssetPath = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In development, use the path as is with leading slash
  if (import.meta.env.DEV) {
    return `/${cleanPath}`;
  }
  
  // In production (GitHub Pages), use the base path
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${cleanPath}`;
};

// Specific helpers for common asset types from public directory
export const getTechnologyAsset = (filename) => getAssetPath(`assets/technologies/${filename}`);
export const getPublicAsset = (filename) => getAssetPath(filename);
export const getSrcAsset = (filename) => getAssetPath(`src/assets/${filename}`);
