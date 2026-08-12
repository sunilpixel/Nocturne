'use client';

import { useRef } from 'react';

import { ScrollTrigger } from '@/animations/core';
import { createTextReveal, type TextRevealOptions } from '@/animations/text';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { prefersReducedMotion } from '@/lib/utils';

type Options = TextRevealOptions & {
  /** Hold the reveal until the preloader has handed the page over. */
  enabled?: boolean;
};

/**
 * Splits an element with SplitType and animates it in.
 *
 * Re-splits on width change (line boxes are width-dependent, so a resize
 * without a re-split leaves masks in the wrong place) and always reverts the
 * split on unmount so the DOM returns to plain, selectable, indexable text.
 */
export function useTextReveal<T extends HTMLElement = HTMLHeadingElement>(options: Options = {}) {
  const ref = useRef<T>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { enabled = true, variant, delay } = options;

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    // Reduced motion: show the copy, skip the choreography entirely.
    if (prefersReducedMotion()) {
      element.style.opacity = '1';
      return;
    }

    let instance: ReturnType<typeof createTextReveal> | null = null;
    let lastWidth = window.innerWidth;

    const build = () => {
      instance?.revert();
      instance = createTextReveal(element, optionsRef.current);
    };

    build();

    // Only a width change invalidates line boxes; height changes (mobile URL
    // bar) must not trigger an expensive re-split.
    const handleResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      build();
      ScrollTrigger.refresh();
    };

    let resizeTimer: number;
    const debouncedResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 220);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedResize);
      instance?.revert();
    };
  }, [enabled, variant, delay]);

  return ref;
}
