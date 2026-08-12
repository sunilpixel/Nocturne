import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect warns during SSR. GSAP setup must run before paint on the
 * client, so swap the implementation rather than dropping to useEffect.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
