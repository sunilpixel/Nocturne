import { cn } from '@/lib/utils';

/**
 * Full-viewport film grain.
 *
 * A tiled SVG rather than a canvas: no per-frame cost, and the browser keeps a
 * single decoded tile in memory. Fixed and pointer-transparent so it never
 * participates in layout or hit-testing.
 */
export function NoiseOverlay({ className, opacity = 0.05 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-0 z-[90] bg-repeat mix-blend-soft-light',
        className,
      )}
      style={{
        backgroundImage: 'url(/noise.svg)',
        backgroundSize: '220px 220px',
        opacity,
      }}
    />
  );
}

/**
 * Scanline + vignette pass. Sits above content but below the cursor, and gives
 * the whole page the slightly filmic falloff the palette is built around.
 *
 * One element carrying two background layers rather than two stacked children.
 * Every fixed, full-viewport element is a surface the compositor has to hold
 * and re-composite on each frame, and this page already stacks several of them
 * over the whole document; the scanlines and the vignette can share one.
 */
export function VignetteOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[89]"
      style={{
        backgroundImage: [
          // Scanlines first so they sit under the vignette's falloff.
          'repeating-linear-gradient(180deg, rgba(236,231,221,0.021) 0px, rgba(236,231,221,0.021) 1px, transparent 1px, transparent 3px)',
          'radial-gradient(ellipse at center, transparent 45%, rgba(3,3,4,0.75) 100%)',
        ].join(','),
      }}
    />
  );
}
