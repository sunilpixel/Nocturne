'use client';

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import type { TextRevealVariant } from '@/animations/text';
import { useTextReveal } from '@/hooks/useTextReveal';
import { cn } from '@/lib/utils';

type AnimatedTextProps = {
  children: ReactNode;
  /** Rendered element — always pick the semantically correct heading level. */
  as?: ElementType;
  variant?: TextRevealVariant;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  /** Gate the reveal on external state (e.g. the preloader finishing). */
  enabled?: boolean;
  /** Override the ScrollTrigger start position, or disable it entirely. */
  start?: string;
  scrollTrigger?: boolean;
} & Omit<ComponentPropsWithoutRef<'h2'>, 'children' | 'className'>;

/**
 * SplitType-backed text reveal.
 *
 * The DOM is split at runtime and fully reverted on unmount, so crawlers and
 * screen readers always see the original, uninterrupted text node. `variant`
 * is what gives each section its own entrance signature.
 */
export function AnimatedText({
  children,
  as: Tag = 'h2',
  variant = 'lines-up',
  delay = 0,
  duration,
  stagger,
  className,
  enabled = true,
  start = 'top 85%',
  scrollTrigger = true,
  ...rest
}: AnimatedTextProps) {
  const ref = useTextReveal<HTMLElement>({
    variant,
    delay,
    duration,
    stagger,
    enabled,
    scrollTrigger: scrollTrigger ? { start } : false,
  });

  return (
    <Tag ref={ref} data-animate="pending" className={cn(className)} {...rest}>
      {children}
    </Tag>
  );
}
