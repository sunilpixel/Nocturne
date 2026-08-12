import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Single registration point for GSAP.
 *
 * Note on smooth scrolling: the brief lists both ScrollSmoother and Lenis.
 * Running both is a conflict — each installs its own scroll proxy and they
 * fight over transform ownership of the wrapper. Lenis is the driver here
 * (see components/providers/SmoothScrollProvider.tsx) and ScrollTrigger is
 * synchronised to it, which gives the same result with a smaller runtime.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  gsap.defaults({ ease: 'power3.out', duration: 1 });

  ScrollTrigger.config({
    // Mobile browsers fire resize when the URL bar collapses; ignoring it
    // stops pinned sections from recalculating mid-scroll.
    ignoreMobileResize: true,
    limitCallbacks: true,
  });
}

/** Shared easing vocabulary — keeps the whole site on one motion language. */
export const EASE = {
  luxe: 'power4.out',
  drama: 'expo.out',
  soft: 'power2.out',
  inOut: 'power3.inOut',
  dramaInOut: 'expo.inOut',
} as const;

export const DURATION = {
  fast: 0.45,
  base: 0.9,
  slow: 1.4,
  cinematic: 2.2,
} as const;

/** Standard viewport trigger — fires when a section is a third of the way up. */
export const ENTER_TRIGGER = {
  start: 'top 80%',
  toggleActions: 'play none none reverse',
} as const;

export const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  motionOk: '(prefers-reduced-motion: no-preference)',
  motionReduced: '(prefers-reduced-motion: reduce)',
} as const;

export { gsap, ScrollTrigger };
