'use client';

import { EASE, gsap } from '@/animations/core';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, isTouchDevice, prefersReducedMotion } from '@/lib/utils';

type Light = {
  className: string;
  /** Pointer-follow depth: higher moves further. */
  depth: number;
  /** Independent drift duration so the lights never sync up. */
  duration: number;
};

const LIGHTS: Light[] = [
  {
    className:
      'left-[-18%] top-[-12%] h-[46rem] w-[46rem] bg-[radial-gradient(circle,rgba(216,176,106,0.24),transparent_66%)]',
    depth: 34,
    duration: 17,
  },
  {
    className:
      'right-[-14%] top-[18%] h-[38rem] w-[38rem] bg-[radial-gradient(circle,rgba(155,123,224,0.16),transparent_65%)]',
    depth: -26,
    duration: 21,
  },
  {
    className:
      'bottom-[-20%] left-[26%] h-[42rem] w-[42rem] bg-[radial-gradient(circle,rgba(217,112,63,0.15),transparent_66%)]',
    depth: 20,
    duration: 25,
  },
  {
    className:
      'bottom-[6%] right-[8%] h-[30rem] w-[30rem] bg-[radial-gradient(circle,rgba(111,191,156,0.12),transparent_64%)]',
    depth: -16,
    duration: 19,
  },
];

/**
 * Floating light fields.
 *
 * Two independent motions per light: an endless drift (GSAP, so it shares the
 * app's single ticker) and a parallax offset following the pointer. Both write
 * only to transform, and the pointer listener is skipped entirely on touch.
 *
 * These used to carry `blur(90px)`. On a 46rem element that is a ~740px-wide
 * surface being re-blurred by the GPU every time the drift tween nudges its
 * scale — four of them, permanently, in the hero. A radial gradient that fades
 * to transparent over two-thirds of its radius is already as soft as the blur
 * made it, so the filter was paying for nothing. Do not reintroduce it.
 */
export function AmbientLights({ className, interactive = true }: { className?: string; interactive?: boolean }) {
  const scopeRef = useGsapScope<HTMLDivElement>(
    (scope) => {
      const lights = gsap.utils.toArray<HTMLElement>('[data-light]', scope);
      if (!lights.length || prefersReducedMotion()) return;

      lights.forEach((light, index) => {
        const config = LIGHTS[index % LIGHTS.length]!;

        gsap.to(light, {
          xPercent: gsap.utils.random(-14, 14),
          yPercent: gsap.utils.random(-12, 12),
          scale: gsap.utils.random(0.86, 1.18),
          duration: config.duration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      if (!interactive || isTouchDevice()) return;

      const setters = lights.map((light) => ({
        x: gsap.quickTo(light, 'x', { duration: 1.6, ease: EASE.luxe }),
        y: gsap.quickTo(light, 'y', { duration: 1.6, ease: EASE.luxe }),
        depth: LIGHTS[lights.indexOf(light) % LIGHTS.length]!.depth,
      }));

      const handleMove = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;

        setters.forEach(({ x, y, depth }) => {
          x(nx * depth * 2);
          y(ny * depth * 2);
        });
      };

      window.addEventListener('pointermove', handleMove, { passive: true });
      return () => window.removeEventListener('pointermove', handleMove);
    },
    [interactive],
  );

  return (
    <div
      ref={scopeRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {LIGHTS.map((light, index) => (
        <div
          key={index}
          data-light
          className={cn('absolute rounded-full will-change-transform', light.className)}
        />
      ))}
    </div>
  );
}
