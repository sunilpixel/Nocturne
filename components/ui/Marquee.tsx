'use client';

import { Fragment, useRef, type ReactNode } from 'react';

import { createMarquee } from '@/animations/marquee';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

type MarqueeProps = {
  items: readonly string[];
  direction?: 1 | -1;
  speed?: number;
  className?: string;
  itemClassName?: string;
  /** Rendered between items — defaults to a small gold lozenge. */
  separator?: ReactNode;
  pauseOnHover?: boolean;
};

const DefaultSeparator = () => (
  <span
    aria-hidden="true"
    className="mx-8 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70 md:mx-14"
  />
);

/**
 * Infinite marquee row.
 *
 * The content is rendered twice: the first run is the readable one, the second
 * is aria-hidden so screen readers and search engines see the copy once.
 */
export function Marquee({
  items,
  direction = 1,
  speed = 60,
  className,
  itemClassName,
  separator,
  pauseOnHover = true,
}: MarqueeProps) {
  const controlsRef = useRef<ReturnType<typeof createMarquee> | null>(null);

  const containerRef = useGsapScope<HTMLDivElement>(
    (container) => {
      if (prefersReducedMotion()) return;

      const track = container.querySelector<HTMLElement>('[data-marquee-track]');
      if (!track) return;

      controlsRef.current = createMarquee(track, { direction, speed });
      return () => {
        controlsRef.current?.kill();
        controlsRef.current = null;
      };
    },
    [direction, speed, items],
  );

  const run = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          <span className={cn('shrink-0 whitespace-nowrap', itemClassName)}>{item}</span>
          {separator ?? <DefaultSeparator />}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden', className)}
      onPointerEnter={pauseOnHover ? () => controlsRef.current?.pause() : undefined}
      onPointerLeave={pauseOnHover ? () => controlsRef.current?.resume() : undefined}
    >
      <div data-marquee-track className="flex w-max will-change-transform">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}
