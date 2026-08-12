'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';

import { EASE, gsap } from '@/animations/core';
import { useCursorTarget } from '@/components/providers/CursorProvider';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/lib/utils';

type Variant = 'solid' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<Variant, string> = {
  solid: 'bg-bone text-void hover:bg-gold-soft',
  outline: 'border border-hairline text-bone hover:border-gold/60',
  ghost: 'text-bone hover:text-gold-soft',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-10 px-5 text-[0.68rem]',
  md: 'h-14 px-8 text-[0.72rem]',
  lg: 'h-[4.5rem] px-11 text-[0.78rem]',
};

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Pull strength; 0 disables the magnet while keeping the visual treatment. */
  strength?: number;
  ariaLabel?: string;
  type?: 'button' | 'submit';
};

/**
 * The site's single button primitive: magnetic pull, a click ripple, an
 * ambient glow, and a two-layer label that swaps on hover.
 *
 * Renders as <a> when given href, otherwise <button> — so the semantics follow
 * the behaviour rather than the styling.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = 'outline',
  size = 'md',
  className,
  strength = 0.32,
  ariaLabel,
  type = 'button',
}: MagneticButtonProps) {
  const { ref, labelRef } = useMagnetic<HTMLElement>({ strength });
  const rippleLayerRef = useRef<HTMLSpanElement>(null);
  const cursorTarget = useCursorTarget('link');

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const layer = rippleLayerRef.current;

    if (layer) {
      const rect = layer.getBoundingClientRect();
      const ripple = document.createElement('span');

      ripple.className = 'pointer-events-none absolute rounded-full bg-current opacity-25';
      ripple.style.cssText = `left:${event.clientX - rect.left}px;top:${event.clientY - rect.top}px;width:8px;height:8px;margin:-4px 0 0 -4px;`;
      layer.appendChild(ripple);

      gsap.to(ripple, {
        scale: Math.max(rect.width, rect.height) / 4,
        opacity: 0,
        duration: 0.9,
        ease: EASE.drama,
        // Self-removing: no React state, no re-render, no leaked nodes.
        onComplete: () => ripple.remove(),
      });
    }

    onClick?.(event);
  };

  const content = (
    <>
      {/* Ambient glow — sits behind, fades in on hover. A radial gradient
          rather than a blurred fill: every button on the page carries one, and
          each blurred layer is a separate surface the compositor has to keep
          and re-blur while the magnet is translating the button. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(216,176,106,0.28),transparent_65%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
      />

      <span
        ref={rippleLayerRef}
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-full"
      />

      {/* Two stacked labels give a clean vertical swap without layout shift. */}
      <span ref={labelRef} className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="absolute left-0 top-full block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full"
        >
          {children}
        </span>
      </span>
    </>
  );

  const classes = cn(
    'group relative inline-flex items-center justify-center gap-3 rounded-full',
    'font-medium uppercase tracking-[0.18em] will-change-transform',
    'transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        aria-label={ariaLabel}
        className={classes}
        onClick={handleClick}
        {...cursorTarget}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      aria-label={ariaLabel}
      className={classes}
      onClick={handleClick}
      {...cursorTarget}
    >
      {content}
    </button>
  );
}
