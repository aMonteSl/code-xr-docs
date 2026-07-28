// Theme resolution follows the browser/OS preference (prefers-color-scheme).
// index.html applies the initial .dark class inline before first paint; this
// watcher keeps the class in sync if the user changes their system preference
// while the page is open.
//
// If a manual theme toggle is ever added, persist the override (e.g. in
// localStorage) and read it both here and in the inline index.html snippet.
export const watchSystemTheme = () => {
  const query = window.matchMedia('(prefers-color-scheme: dark)');

  const apply = (event) => {
    document.documentElement.classList.toggle('dark', event.matches);
  };

  query.addEventListener('change', apply);
  return () => query.removeEventListener('change', apply);
};
