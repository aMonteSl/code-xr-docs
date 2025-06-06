export const formatNumber = (num) => {
  // Manejar casos null/undefined
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

export const formatRating = (rating) => {
  // Manejar casos null/undefined
  if (rating === null || rating === undefined || isNaN(rating)) {
    return '--';
  }
  
  return `${rating.toFixed(1)}★`;
};

export const formatVersion = (version) => {
  // Manejar casos null/undefined/empty string
  if (!version || version === null || version === undefined || version.trim() === '') {
    return '--';
  }
  
  // Si ya tiene 'v' al principio, no agregarlo
  if (version.toString().toLowerCase().startsWith('v')) {
    return version;
  }
  
  return `v${version}`;
};