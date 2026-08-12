'use client';

import { gsap, ScrollTrigger } from '@/animations/core';
import { useGsapScope } from '@/hooks/useGsapScope';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * Document-level reading progress.
 *
 * Driven entirely by a scrubbed ScrollTrigger writing scaleY on one element —
 * no React state, so it costs a single compositor property per frame no matter
 * how long the page is.
 */
export function ScrollProgress() {
  const rootRef = useGsapScope<HTMLDivElement>((root) => {
    if (prefersReducedMotion()) return;

    const bar = root.querySelector<HTMLElement>('[data-scroll-progress]');
    if (!bar) return;

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => gsap.set(bar, { scaleY: self.progress }),
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed right-6 top-1/2 z-[95] hidden h-40 -translate-y-1/2 lg:block"
    >
      <div className="relative h-full w-px bg-hairline">
        <div
          data-scroll-progress
          className="absolute inset-0 origin-top scale-y-0 bg-gradient-to-b from-gold-soft via-gold to-gold-deep will-change-transform"
        />
      </div>
    </div>
  );
}
