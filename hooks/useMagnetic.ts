'use client';

import { useRef } from 'react';

import { EASE, gsap, ScrollTrigger } from '@/animations/core';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { isTouchDevice, prefersReducedMotion } from '@/lib/utils';

type MagneticOptions = {
  /** How far the element travels toward the pointer, as a fraction of offset. */
  strength?: number;
  /** Independent, usually larger, pull applied to the inner label. */
  labelStrength?: number;
  /** Scale applied while the pointer is inside. */
  scale?: number;
  /** Extra hit area in px beyond the element's own box. */
  padding?: number;
};

/**
 * Magnetic pointer attraction.
 *
 * Uses gsap.quickTo so pointermove only writes to an already-running tween
 * instead of allocating a new one per event — the difference between smooth
 * and janky on a 120Hz trackpad.
 *
 * The magnet has to reach beyond the element's own box, so the listener is
 * necessarily on the window. That makes measurement the thing to watch: every
 * magnetic button on the page sees every pointer event, so a
 * getBoundingClientRect() per event meant one forced layout per button per
 * move. The box is cached instead and re-measured only when scroll, resize or
 * a ScrollTrigger refresh could have moved it.
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  options: MagneticOptions = {},
) {
  const { strength = 0.32, labelStrength = 0.14, scale = 1.04, padding = 28 } = options;

  const ref = useRef<T>(null);
  const labelRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || isTouchDevice() || prefersReducedMotion()) return;

    const label = labelRef.current;
    const tweenConfig = { duration: 0.9, ease: EASE.luxe } as const;

    const moveX = gsap.quickTo(element, 'x', tweenConfig);
    const moveY = gsap.quickTo(element, 'y', tweenConfig);
    const labelX = label ? gsap.quickTo(label, 'x', tweenConfig) : null;
    const labelY = label ? gsap.quickTo(label, 'y', tweenConfig) : null;

    let inside = false;

    let rect = element.getBoundingClientRect();
    let stale = true;

    const invalidate = () => {
      stale = true;
    };

    const handleMove = (event: PointerEvent) => {
      // Never re-measure mid-pull: the magnet translates the element, so a
      // fresh box while engaged would fold the current offset into the centre
      // and the button would chase itself.
      if (stale && !inside) {
        rect = element.getBoundingClientRect();
        stale = false;
      }

      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);

      const within =
        Math.abs(relX) < rect.width / 2 + padding && Math.abs(relY) < rect.height / 2 + padding;

      if (within) {
        if (!inside) {
          inside = true;
          gsap.to(element, { scale, duration: 0.5, ease: EASE.luxe });
        }
        moveX(relX * strength);
        moveY(relY * strength);
        labelX?.(relX * labelStrength);
        labelY?.(relY * labelStrength);
      } else if (inside) {
        inside = false;
        gsap.to(element, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
        moveX(0);
        moveY(0);
        labelX?.(0);
        labelY?.(0);
      }
    };

    const reset = () => {
      inside = false;
      stale = true;
      gsap.to(element, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      moveX(0);
      moveY(0);
      labelX?.(0);
      labelY?.(0);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });
    ScrollTrigger.addEventListener('refresh', invalidate);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('blur', reset);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      ScrollTrigger.removeEventListener('refresh', invalidate);
      gsap.killTweensOf([element, label].filter(Boolean) as HTMLElement[]);
      gsap.set(element, { clearProps: 'transform' });
    };
  }, [strength, labelStrength, scale, padding]);

  return { ref, labelRef };
}
