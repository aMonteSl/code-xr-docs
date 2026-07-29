import { Moon, Sun } from 'lucide-react';

// Dumb component: the parent owns the theme and the toggling. Both icons are
// always mounted, stacked in one grid cell, and swap by rotating and scaling
// past each other — a clean turn, no flashes.
//
// That turn is only *seen* where view transitions are unavailable. Where they
// are, the page is replaced by snapshots for 500ms and the swap is baked into
// them: the reveal starts at this button, so the new icon is simply the first
// thing the circle uncovers. It stays because it is the whole animation in the
// fallback path — see hooks/useTheme.js.
//
// `onToggle` receives the click event; useTheme reads its currentTarget to
// start the reveal from this button. Passing it on is all this needs to know.
const ThemeToggle = ({ theme, onToggle, label }) => {
  const isDark = theme === 'dark';
  const iconClass =
    'col-start-1 row-start-1 size-5 transition-[opacity,transform] duration-500 motion-reduce:transition-none';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-lg text-ink-muted transition-[color,background-color] duration-300 hover:bg-surface-raised hover:text-ink motion-reduce:transition-none"
    >
      <span className="grid">
        <Sun
          aria-hidden="true"
          className={`${iconClass} ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        />
        <Moon
          aria-hidden="true"
          className={`${iconClass} ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
