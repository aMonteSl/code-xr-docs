import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Dumb component: a shell command with a copy button. The only state is
// whether the last copy just happened, which flips the icon for two seconds —
// trivial UI state, no data, no copy strings of its own.
//
// The reset lives in an effect keyed on that state so the timer is cleaned up
// if the component unmounts mid-countdown, and so a second click restarts the
// two seconds instead of stacking timers.
const CommandBlock = ({ command, copyLabel, copiedLabel, className = '' }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }

    const timerId = setTimeout(() => setIsCopied(false), 2000);
    return () => clearTimeout(timerId);
  }, [isCopied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setIsCopied(true);
    } catch {
      // Clipboard access can be refused (insecure context, denied permission).
      // The command stays selectable on screen, so there is nothing to recover
      // from and nothing worth shouting about in the console.
    }
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-edge bg-surface-sunken p-2 pl-3 ${className}`}
    >
      {/* min-w-0 + overflow-x-auto: a long command scrolls inside its own box
          instead of widening the card and the page with it. */}
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap text-ink">
        {command}
      </code>

      <button
        type="button"
        onClick={copy}
        aria-label={isCopied ? copiedLabel : copyLabel}
        className="flex size-11 shrink-0 items-center justify-center rounded-md border border-edge bg-surface text-ink-muted transition-[border-color,color] duration-300 hover:border-accent/40 hover:text-ink motion-reduce:transition-none"
      >
        {isCopied ? (
          <Check aria-hidden="true" className="size-4 text-accent" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
};

export default CommandBlock;
