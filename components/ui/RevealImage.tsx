'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { gsap } from '@/animations/core';
import { clipReveal, parallax, type ClipDirection } from '@/animations/reveals';
import type { Artwork } from '@/constants/artwork';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

type RevealImageProps = {
  artwork: Artwork;
  /** Direction the clip-path curtain travels. */
  direction?: ClipDirection;
  /** Parallax travel as a % of element height. 0 disables it. */
  parallaxStrength?: number;
  /** Scale the media on hover — only meaningful inside a `group` parent. */
  hoverZoom?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  /** Skip the entrance when a parent timeline owns the reveal instead. */
  animate?: boolean;
  delay?: number;
};

/**
 * The site's image primitive.
 *
 * Three nested layers, each owning exactly one transform channel, so nothing
 * fights for the same matrix:
 *   frame  — clip-path curtain
 *   layer  — scrubbed parallax (translateY)
 *   media  — reveal scale, then CSS-driven hover zoom once GSAP clears it
 */
export function RevealImage({
  artwork,
  direction = 'up',
  parallaxStrength = 0,
  hoverZoom = true,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw',
  className,
  imageClassName,
  animate = true,
  delay = 0,
}: RevealImageProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const frameRef = useGsapScope<HTMLDivElement>(
    (frame) => {
      if (prefersReducedMotion()) return;

      if (animate) {
        clipReveal(frame, mediaRef.current, { direction, delay });
      }

      if (parallaxStrength > 0 && layerRef.current) {
        // Over-scale the parallax layer so its travel never exposes an edge.
        gsap.set(layerRef.current, { scale: 1 + parallaxStrength / 100 + 0.06 });
        parallax(layerRef.current, { strength: parallaxStrength, trigger: frame });
      }
    },
    [animate, direction, parallaxStrength, delay],
  );

  return (
    <div
      ref={frameRef}
      className={cn('relative overflow-hidden bg-smoke', className)}
    >
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        <div ref={mediaRef} className="relative h-full w-full will-change-transform">
          <Image
            src={artwork.src}
            alt={artwork.alt}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            placeholder="blur"
            blurDataURL={artwork.blurDataURL}
            className={cn(
              'object-cover',
              hoverZoom &&
                'transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]',
              imageClassName,
            )}
          />
        </div>
      </div>

      {/* Grade: keeps artwork sitting behind type without dulling its colour. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 via-void/10 to-transparent"
      />
    </div>
  );
}
