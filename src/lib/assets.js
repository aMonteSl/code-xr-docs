// Resolve public/ asset paths against the Vite base URL. Never reference
// public/ files with bare string paths from components.
export const getAssetPath = (path) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${cleanPath}`;
};

export const getReleaseAsset = (version, filename) =>
  getAssetPath(`assets/releases/${version}/${filename}`);

export const getTechnologyAsset = (filename) =>
  getAssetPath(`assets/technologies/${filename}`);
