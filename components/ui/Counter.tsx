'use client';

import { countTo, drawRing, fillBar } from '@/animations/stats';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Counter                                                                   */
/* -------------------------------------------------------------------------- */

type CounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delay?: number;
  className?: string;
};

/**
 * Animated number.
 *
 * The final value is present in the markup on the server, so the correct figure
 * is what gets indexed and what reduced-motion users see; the tween only takes
 * over on the client.
 */
export function Counter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  delay = 0,
  className,
}: CounterProps) {
  const ref = useGsapScope<HTMLSpanElement>(
    (scope) => {
      if (prefersReducedMotion()) return;

      const number = scope.querySelector<HTMLElement>('[data-counter-value]');
      if (!number) return;

      number.textContent = (0).toFixed(decimals);
      countTo(number, value, { decimals, trigger: scope, delay });
    },
    [value, decimals, delay],
  );

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      <span data-counter-value>{value.toFixed(decimals)}</span>
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress bar                                                              */
/* -------------------------------------------------------------------------- */

type ProgressBarProps = {
  /** 0–1. */
  progress: number;
  delay?: number;
  className?: string;
};

export function ProgressBar({ progress, delay = 0, className }: ProgressBarProps) {
  const ref = useGsapScope<HTMLDivElement>(
    (scope) => {
      const bar = scope.querySelector<HTMLElement>('[data-progress-fill]');
      if (!bar) return;

      if (prefersReducedMotion()) {
        bar.style.transform = `scaleX(${progress})`;
        return;
      }

      fillBar(bar, progress, { trigger: scope, delay });
    },
    [progress, delay],
  );

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-px w-full overflow-hidden bg-hairline', className)}
    >
      <div
        data-progress-fill
        className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-gold-soft will-change-transform"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress ring                                                             */
/* -------------------------------------------------------------------------- */

type ProgressRingProps = {
  /** 0–1. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
};

export function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 2,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const ref = useGsapScope<HTMLDivElement>(
    (scope) => {
      const circle = scope.querySelector<SVGCircleElement>('[data-ring-progress]');
      if (!circle) return;

      if (prefersReducedMotion()) {
        circle.style.strokeDasharray = String(circumference);
        circle.style.strokeDashoffset = String(circumference * (1 - progress));
        return;
      }

      drawRing(circle, progress, circumference, { trigger: scope });
    },
    [progress, circumference],
  );

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold-deep)" />
            <stop offset="55%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="var(--color-gold-soft)" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={strokeWidth}
        />
        <circle
          data-ring-progress
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 12px rgba(216,176,106,0.45))' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
