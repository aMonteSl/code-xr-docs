// Theme store. A manual choice is persisted in localStorage and wins; with no
// stored choice the site follows the OS (prefers-color-scheme) and keeps
// following it live.
//
// index.html applies the resolved theme inline before first paint, reading the
// same key with the same precedence — keep the two in step.
const STORAGE_KEY = 'codexr:theme';

const listeners = new Set();
let mediaQuery = null;

const getMediaQuery = () => {
  mediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery;
};

// localStorage throws outright in Safari private mode, so every touch is
// guarded — the site must never fail to render over a theme preference.
const readOverride = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
};

const writeOverride = (theme) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // A full or unavailable quota only costs persistence, not the toggle.
  }
};

const systemTheme = () => (getMediaQuery().matches ? 'dark' : 'light');

export const getTheme = () => readOverride() ?? systemTheme();

const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const setTheme = (theme) => {
  writeOverride(theme);
  applyTheme(theme);
  notify();
};

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

export const subscribe = (onChange) => {
  listeners.add(onChange);

  // The OS preference only matters while no manual choice is stored.
  const handleSystemChange = () => {
    if (!readOverride()) {
      applyTheme(systemTheme());
      notify();
    }
  };

  // Another tab changed the stored choice.
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      applyTheme(getTheme());
      notify();
    }
  };

  const query = getMediaQuery();
  query.addEventListener('change', handleSystemChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(onChange);
    query.removeEventListener('change', handleSystemChange);
    window.removeEventListener('storage', handleStorage);
  };
};

// Called once from main.jsx: reconciles the class with the resolved theme in
// case anything raced the inline snippet.
export const watchSystemTheme = () => {
  applyTheme(getTheme());
};
