'use client';

import { useEffect, useRef } from 'react';

import { EASE, gsap } from '@/animations/core';
import { useCursorState, type CursorVariant } from '@/components/providers/CursorProvider';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useHasPointer, useReducedMotion } from '@/hooks/useMediaQuery';

type VariantSpec = {
  ring: gsap.TweenVars;
  dot: gsap.TweenVars;
  label: gsap.TweenVars;
};

/** Each variant is a target state for three layers, tweened independently. */
const VARIANTS: Record<CursorVariant, VariantSpec> = {
  default: {
    ring: { scale: 1, opacity: 1, borderWidth: 1, backgroundColor: 'rgba(216,176,106,0)' },
    dot: { scale: 1, opacity: 1 },
    label: { opacity: 0, scale: 0.8 },
  },
  link: {
    ring: { scale: 1.9, opacity: 1, borderWidth: 1, backgroundColor: 'rgba(216,176,106,0.1)' },
    dot: { scale: 0, opacity: 0 },
    label: { opacity: 0, scale: 0.8 },
  },
  view: {
    ring: { scale: 3.4, opacity: 1, borderWidth: 0, backgroundColor: 'rgba(236,231,221,0.95)' },
    dot: { scale: 0, opacity: 0 },
    label: { opacity: 1, scale: 1 },
  },
  drag: {
    ring: { scale: 3.4, opacity: 1, borderWidth: 1, backgroundColor: 'rgba(236,231,221,0.14)' },
    dot: { scale: 0, opacity: 0 },
    label: { opacity: 1, scale: 1 },
  },
  text: {
    ring: { scale: 0.4, opacity: 0.75, borderWidth: 1, backgroundColor: 'rgba(236,231,221,0.9)' },
    dot: { scale: 0, opacity: 0 },
    label: { opacity: 0, scale: 0.8 },
  },
  plate: {
    ring: { scale: 0.25, opacity: 0.6, borderWidth: 1, backgroundColor: 'rgba(236,231,221,0)' },
    dot: { scale: 0, opacity: 0 },
    label: { opacity: 0, scale: 0.8 },
  },
  hidden: {
    ring: { scale: 0, opacity: 0, borderWidth: 1, backgroundColor: 'rgba(216,176,106,0)' },
    dot: { scale: 0, opacity: 0 },
    label: { opacity: 0, scale: 0.8 },
  },
};

/**
 * Custom cursor: a lagging ring, a near-instant dot, a label, and an artwork
 * preview that the archive grid fills in.
 *
 * Position is written with gsap.quickTo — pointermove mutates live tweens
 * rather than allocating one per event, so the whole thing costs three matrix
 * writes per frame. Never mounts on touch or under reduced motion.
 *
 * Tailwind's translate utilities compile to the standalone `translate`
 * property in v4, which composes with (rather than fights) GSAP's `transform`.
 * That is what lets the -50%/-50% centring coexist with tweened x/y.
 */
export function Cursor() {
  const hasPointer = useHasPointer();
  const reducedMotion = useReducedMotion();
  const { variant, label, preview } = useCursorState();

  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<HTMLDivElement>(null);

  const enabled = hasPointer && !reducedMotion;

  // Flag the OS cursor off only while ours is genuinely running.
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.setAttribute('data-custom-cursor', 'true');
    return () => root.removeAttribute('data-custom-cursor');
  }, [enabled]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const previewEl = previewRef.current;
    if (!ring || !dot || !previewEl) return;

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: EASE.luxe });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: EASE.luxe });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });
    const previewX = gsap.quickTo(previewEl, 'x', { duration: 0.9, ease: EASE.luxe });
    const previewY = gsap.quickTo(previewEl, 'y', { duration: 0.9, ease: EASE.luxe });

    let hasMoved = false;

    const handleMove = (event: PointerEvent) => {
      const { clientX, clientY } = event;

      if (!hasMoved) {
        hasMoved = true;
        gsap.set([ring, dot, previewEl], { x: clientX, y: clientY });
        gsap.to(rootRef.current, { autoAlpha: 1, duration: 0.4 });
      }

      ringX(clientX);
      ringY(clientY);
      dotX(clientX);
      dotY(clientY);
      previewX(clientX);
      previewY(clientY);
    };

    // Press gives the whole cursor a physical "click in" response. Scaling the
    // wrapper keeps it independent of the per-variant ring tween.
    const handleDown = () => gsap.to(pressRef.current, { scale: 0.78, duration: 0.25, ease: EASE.luxe });
    const handleUp = () => gsap.to(pressRef.current, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' });
    const handleLeave = () => gsap.to(rootRef.current, { autoAlpha: 0, duration: 0.3 });
    const handleEnter = () => gsap.to(rootRef.current, { autoAlpha: 1, duration: 0.3 });

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    document.addEventListener('pointerleave', handleLeave);
    document.addEventListener('pointerenter', handleEnter);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointerleave', handleLeave);
      document.removeEventListener('pointerenter', handleEnter);
      gsap.killTweensOf([ring, dot, previewEl, pressRef.current, rootRef.current]);
    };
  }, [enabled]);

  // Morph on variant change — concurrent tweens, no layout involved.
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;

    const spec = VARIANTS[variant];
    gsap.to(ringRef.current, { ...spec.ring, duration: 0.55, ease: EASE.luxe });
    gsap.to(dotRef.current, { ...spec.dot, duration: 0.35, ease: EASE.luxe });
    gsap.to(labelRef.current, { ...spec.label, duration: 0.4, ease: EASE.luxe });
    gsap.to(previewRef.current, {
      scale: variant === 'plate' ? 1 : 0.55,
      autoAlpha: variant === 'plate' ? 1 : 0,
      rotate: variant === 'plate' ? -3 : 0,
      duration: 0.7,
      ease: EASE.luxe,
    });
  }, [variant, enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200] opacity-0 max-lg:hidden"
    >
      <div ref={pressRef} className="absolute inset-0 origin-center">
        {/* Preview sits outside the blend layer so artwork renders true to colour. */}
        <div
          ref={previewRef}
          className="absolute left-0 top-0 h-56 w-44 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-bone/10 opacity-0 shadow-lift will-change-transform"
        >
          {preview ? (
            // Plain <img>: the source swaps on hover, and next/image's wrapper
            // would add a layout pass we don't want inside a per-frame element.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>

        {/* Difference blend makes the ring legible over both artwork and ink.
            Applied to the two small elements themselves rather than to a
            full-viewport wrapper: a blend mode on an `inset-0` layer makes the
            compositor blend the entire screen on every frame the cursor moves,
            where blending a 40px ring and a 6px dot costs essentially nothing.
            The blended boxes must stay isolated from the preview above, which
            is why this is not simply hoisted onto the press wrapper. */}
        <div
          ref={ringRef}
          className="absolute left-0 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-bone/70 mix-blend-difference will-change-transform"
        >
          <span
            ref={labelRef}
            className="select-none whitespace-nowrap text-[0.5rem] font-medium uppercase tracking-[0.2em] text-void opacity-0"
          >
            {label}
          </span>
        </div>

        <div
          ref={dotRef}
          className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bone mix-blend-difference will-change-transform"
        />
      </div>
    </div>
  );
}
