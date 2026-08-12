import { DURATION, EASE, gsap } from '@/animations/core';

/**
 * Count a number up on scroll.
 *
 * Writes to textContent rather than React state — a per-frame setState would
 * re-render the component ~120 times during the count for no benefit.
 */
export function countTo(
  element: HTMLElement,
  value: number,
  options: { duration?: number; decimals?: number; trigger?: HTMLElement; delay?: number } = {},
) {
  const { duration = 2.2, decimals = 0, trigger = element, delay = 0 } = options;
  const counter = { current: 0 };

  return gsap.to(counter, {
    current: value,
    duration,
    delay,
    ease: 'power2.out',
    // Snapping keeps integers integral all the way through the tween.
    snap: decimals === 0 ? { current: 1 } : undefined,
    onUpdate: () => {
      element.textContent = counter.current.toFixed(decimals);
    },
    scrollTrigger: { trigger, start: 'top 82%', once: true },
  });
}

/** Horizontal bar that fills to a 0–1 ratio. */
export function fillBar(
  element: HTMLElement,
  progress: number,
  options: { trigger?: HTMLElement; delay?: number } = {},
) {
  const { trigger = element, delay = 0 } = options;

  return gsap.fromTo(
    element,
    { scaleX: 0, transformOrigin: 'left center' },
    {
      scaleX: progress,
      duration: DURATION.cinematic,
      delay,
      ease: EASE.drama,
      scrollTrigger: { trigger, start: 'top 85%', once: true },
    },
  );
}

/**
 * Draw an SVG ring to a 0–1 ratio.
 * `circumference` is passed in because the caller already knows the radius —
 * reading it back from the DOM would force an extra layout.
 */
export function drawRing(
  circle: SVGCircleElement,
  progress: number,
  circumference: number,
  options: { trigger?: Element; delay?: number } = {},
) {
  const { trigger = circle, delay = 0 } = options;

  gsap.set(circle, { strokeDasharray: circumference, strokeDashoffset: circumference });

  return gsap.to(circle, {
    strokeDashoffset: circumference * (1 - progress),
    duration: DURATION.cinematic * 1.2,
    delay,
    ease: EASE.drama,
    scrollTrigger: { trigger, start: 'top 82%', once: true },
  });
}
