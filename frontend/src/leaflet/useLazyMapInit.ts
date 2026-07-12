import { useRef } from 'react';

/**
 * Mirrors the original's `if(!builder.map) initBuilder()` lazy-construction
 * pattern for Map Builder / Crossings: once `shouldInit` becomes true (the
 * tab is first visited), stays true for the lifetime of the component even
 * if `shouldInit` later becomes false again (switching away doesn't tear the
 * map down — see the "permanently mounted, CSS-hidden" pattern in App.tsx).
 */
export function useLazyMapInit(shouldInit: boolean): boolean {
  const initiated = useRef(false);
  if (shouldInit) initiated.current = true;
  return initiated.current;
}
