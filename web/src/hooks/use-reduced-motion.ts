import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getInitialMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * Tracks the user's `prefers-reduced-motion` OS/browser preference live —
 * updates if they flip the setting while the page stays open. Defaults to
 * `false` (motion allowed) in environments without `matchMedia`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getInitialMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
