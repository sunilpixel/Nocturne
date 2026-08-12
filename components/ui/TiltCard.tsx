'use client';

import type { ReactNode } from 'react';

import { useTilt } from '@/hooks/useTilt';
import { cn } from '@/lib/utils';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  max?: number;
  /** Disable the 3D response while keeping the surface treatment. */
  interactive?: boolean;
};

/**
 * Glass surface with pointer-tracked 3D tilt and a light that follows the
 * cursor across it.
 *
 * The tilt writes rotationX/rotationY on this wrapper only — children are free
 * to run their own transforms without conflict.
 */
export function TiltCard({ children, className, max = 8, interactive = true }: TiltCardProps) {
  const { ref, glareRef } = useTilt<HTMLDivElement>({ max, glare: interactive });

  return (
    <div
      ref={interactive ? ref : undefined}
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-luxe)]',
        'glass rim reflect shadow-lift will-change-transform',
        className,
      )}
    >
      {/* Pointer-tracked highlight.
          A fixed gradient on an oversized, centre-origin layer that useTilt
          translates — the gradient itself never changes, so following the
          cursor costs a transform rather than a full-surface repaint. */}
      <div
        ref={glareRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[4] h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,221,176,0.18),transparent_55%)] opacity-0 will-change-transform"
      />
      {children}
    </div>
  );
}
