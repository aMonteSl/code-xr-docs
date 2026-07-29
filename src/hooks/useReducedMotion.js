import { useSyncExternalStore } from 'react';

// Built on useSyncExternalStore rather than useState + useEffect: there is no
// setState in an effect at all, so the compiler-backed react-hooks rule has
// nothing to object to, and the value is correct on the very first render.
const QUERY = '(prefers-reduced-motion: reduce)';

let mediaQuery = null;

const getMediaQuery = () => {
  mediaQuery ??= window.matchMedia(QUERY);
  return mediaQuery;
};

const subscribe = (onChange) => {
  const query = getMediaQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getSnapshot = () => getMediaQuery().matches;

// The site is client-rendered, but keep a server snapshot so the hook stays
// safe if prerendering is ever added: assume motion is allowed.
const getServerSnapshot = () => false;

export const useReducedMotion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
