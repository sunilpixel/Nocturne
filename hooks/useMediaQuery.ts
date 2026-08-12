'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query subscription. Starts false on the server and on first
 * client paint, then settles — components must therefore treat `false` as
 * "not yet known" rather than "definitely not matching".
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const useHasPointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');
