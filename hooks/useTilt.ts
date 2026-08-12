'use client';

import { useRef } from 'react';

import { EASE, gsap } from '@/animations/core';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { isTouchDevice, prefersReducedMotion } from '@/lib/utils';

type TiltOptions = {
  /** Maximum rotation on each axis, in degrees. */
  max?: number;
  /** Perspective distance in px — lower is more dramatic. */
  perspective?: number;
  scale?: number;
  /** Optional child that receives an amplified counter-translation. */
  glare?: boolean;
};

/**
 * 3D tilt driven by pointer position within the element's own box.
 *
 * Two things this deliberately does not do on pointermove:
 *
 *   1. Allocate tweens. Every channel goes through gsap.quickTo, so a move
 *      event mutates an already-running tween instead of constructing a new
 *      one — on a 120Hz trackpad that is the difference between smooth and
 *      janky.
 *   2. Touch paint-only properties. The glare used to be driven by writing a
 *      fresh `radial-gradient(...)` string into `background` on every event,
 *      which repainted the full card surface each time. It is now a static
 *      gradient on an oversized layer that is simply translated, so the whole
 *      interaction is transform and opacity — compositor work, not paint.
 *
 * The element's box is measured on enter and re-measured only when scroll or
 * resize could have invalidated it, rather than on every move.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions = {}) {
  const { max = 9, perspective = 1000, scale = 1.02, glare = true } = options;

  const ref = useRef<T>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || isTouchDevice() || prefersReducedMotion()) return;

    gsap.set(element, { transformPerspective: perspective, transformStyle: 'preserve-3d' });

    const config = { duration: 0.7, ease: EASE.luxe } as const;
    const rotateX = gsap.quickTo(element, 'rotationX', config);
    const rotateY = gsap.quickTo(element, 'rotationY', config);

    const glareEl = glare ? glareRef.current : null;
    const glareX = glareEl ? gsap.quickTo(glareEl, 'x', { duration: 0.5, ease: EASE.luxe }) : null;
    const glareY = glareEl ? gsap.quickTo(glareEl, 'y', { duration: 0.5, ease: EASE.luxe }) : null;

    // Cached box. `stale` is flipped by anything that can move the element
    // without the pointer having moved, so a hovering pointer over a scrolling
    // (or pinned) card still tracks correctly without measuring every event.
    let box = element.getBoundingClientRect();
    let stale = true;

    const invalidate = () => {
      stale = true;
    };

    const handleMove = (event: PointerEvent) => {
      if (stale) {
        box = element.getBoundingClientRect();
        stale = false;
      }

      const px = (event.clientX - box.left) / box.width;
      const py = (event.clientY - box.top) / box.height;

      rotateY((px - 0.5) * max * 2);
      rotateX((0.5 - py) * max * 2);

      // The glare layer is centred on its own box, so translating it by the
      // pointer's offset within the card puts the highlight under the cursor.
      glareX?.(px * box.width);
      glareY?.(py * box.height);
    };

    const handleEnter = () => {
      stale = true;
      gsap.to(element, { scale, duration: 0.6, ease: EASE.luxe });
      if (glareEl) gsap.to(glareEl, { opacity: 0.5, duration: 0.4 });
    };

    const handleLeave = () => {
      gsap.to(element, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 1,
        ease: 'elastic.out(1, 0.6)',
      });
      if (glareEl) gsap.to(glareEl, { opacity: 0, duration: 0.5 });
    };

    element.addEventListener('pointerenter', handleEnter);
    element.addEventListener('pointermove', handleMove, { passive: true });
    element.addEventListener('pointerleave', handleLeave);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });

    return () => {
      element.removeEventListener('pointerenter', handleEnter);
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      gsap.killTweensOf(element);
      if (glareEl) gsap.killTweensOf(glareEl);
      gsap.set(element, { clearProps: 'transform,transformPerspective,transformStyle' });
    };
  }, [max, perspective, scale, glare]);

  return { ref, glareRef };
}
