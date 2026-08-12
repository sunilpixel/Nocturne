import type { Ref } from 'react';

import { cn } from '@/lib/utils';

/**
 * The house mark: a rotated square containing an N.
 *
 * Drawn as a single <path> with two subpaths so getTotalLength() returns one
 * continuous value — that is what lets the preloader stroke it on as a single
 * gesture rather than several disconnected ones.
 */
export function Monogram({
  className,
  animated = false,
  strokeWidth = 2,
  ref,
}: {
  className?: string;
  /** Tags the path for the preloader's draw-on timeline. */
  animated?: boolean;
  strokeWidth?: number;
  /** React 19 passes ref as an ordinary prop — no forwardRef needed. */
  ref?: Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn('overflow-visible', className)}
    >
      <path
        {...(animated ? { 'data-monogram-path': '' } : {})}
        d="M32 3 L61 32 L32 61 L3 32 Z M22 43 V21 L42 43 V21"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
