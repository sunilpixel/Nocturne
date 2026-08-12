'use client';

import Lenis from 'lenis';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import { gsap, ScrollTrigger } from '@/animations/core';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { prefersReducedMotion } from '@/lib/utils';

type ScrollToOptions = {
  offset?: number;
  immediate?: boolean;
  duration?: number;
};

type ScrollTo = (target: string | number | HTMLElement, options?: ScrollToOptions) => void;

type SmoothScrollContextValue = {
  /** Ref accessor — the instance is created in an effect, after first render. */
  getLenis: () => Lenis | null;
  scrollTo: ScrollTo;
  stop: () => void;
  start: () => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

/**
 * Lenis + GSAP, wired the way the two libraries expect.
 *
 * Deliberately *not* used: ScrollTrigger.scrollerProxy. Lenis scrolls the real
 * window rather than transforming a wrapper, so ScrollTrigger's default
 * measurements are already correct — a proxy here breaks pinning.
 *
 * Also deliberately not exposing scroll progress via React state: that would
 * re-render this provider's entire subtree every frame. Consumers that need
 * progress animate the DOM directly through ScrollTrigger instead.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useIsomorphicLayoutEffect(() => {
    // Honour the OS setting: native scrolling, no interpolation, no rAF loop.
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.15,
      // Exponential ease-out — long tail, no visible settle step.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Native momentum on touch beats an interpolated approximation of it.
      syncTouch: false,
      autoRaf: false,
    });

    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    // One ticker for the whole app: GSAP drives Lenis, so tweens and scroll
    // interpolation resolve in the same frame and never tear.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Pinned sections change document height; Lenis must re-measure with them.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback<ScrollTo>((target, options = {}) => {
    const { offset = 0, immediate = false, duration } = options;
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(target, { offset, immediate, duration });
      return;
    }

    // Reduced-motion path: no Lenis instance exists, so drive the window.
    if (typeof target === 'number') {
      window.scrollTo({ top: target + offset, behavior: immediate ? 'auto' : 'smooth' });
      return;
    }

    const node = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!node) return;

    const top = node.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
  }, []);

  const stop = useCallback(() => {
    lenisRef.current?.stop();
    document.documentElement.setAttribute('data-loading', 'true');
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
    document.documentElement.removeAttribute('data-loading');
  }, []);

  const getLenis = useCallback(() => lenisRef.current, []);

  const value = useMemo<SmoothScrollContextValue>(
    () => ({ getLenis, scrollTo, stop, start }),
    [getLenis, scrollTo, stop, start],
  );

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error('useSmoothScroll must be used inside <SmoothScrollProvider>');
  }
  return context;
}
