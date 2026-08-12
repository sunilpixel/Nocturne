'use client';

import { useRef, type DependencyList, type RefObject } from 'react';

import { gsap, ScrollTrigger } from '@/animations/core';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

type ScopeSetup<T extends HTMLElement> = (
  scope: T,
  context: gsap.Context,
) => void | (() => void);

/**
 * The animation contract for the whole site.
 *
 * Every tween created inside `setup` is captured by a gsap.context scoped to the
 * returned ref, so a single ctx.revert() on unmount kills the tweens, removes
 * their ScrollTriggers and restores inline styles. No manual bookkeeping, no
 * leaked triggers between route changes or Fast Refresh cycles.
 */
export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
  setup: ScopeSetup<T>,
  deps: DependencyList = [],
): RefObject<T | null> {
  const scopeRef = useRef<T>(null);
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    let cleanup: void | (() => void);

    const context = gsap.context((self) => {
      cleanup = setupRef.current(scope, self);
    }, scope);

    return () => {
      if (typeof cleanup === 'function') cleanup();
      context.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}

/**
 * Recalculates every pinned/scrubbed trigger. Call after content that changes
 * document height finishes (fonts, the preloader, an opened menu).
 */
export function refreshScrollTriggers() {
  if (typeof window === 'undefined') return;
  ScrollTrigger.refresh();
}
