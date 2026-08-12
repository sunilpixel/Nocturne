'use client';

import type { ReactNode } from 'react';

import type { TextRevealVariant } from '@/animations/text';
import { drawLine, fadeIn } from '@/animations/reveals';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

type SectionHeaderProps = {
  index: string;
  eyebrow: string;
  title: ReactNode;
  variant?: TextRevealVariant;
  lede?: string;
  align?: 'left' | 'center';
  className?: string;
  titleClassName?: string;
};

/**
 * The masthead every section opens with: index, label, drawn rule, heading and
 * optional lede. One component keeps the vertical rhythm identical throughout.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  variant = 'lines-up',
  lede,
  align = 'left',
  className,
  titleClassName,
}: SectionHeaderProps) {
  const scopeRef = useGsapScope<HTMLDivElement>((scope) => {
    if (prefersReducedMotion()) return;

    const meta = scope.querySelector<HTMLElement>('[data-header-meta]');
    const rule = scope.querySelector<HTMLElement>('[data-header-rule]');
    const ledeEl = scope.querySelector<HTMLElement>('[data-header-lede]');

    if (meta) fadeIn(meta, { variant: 'up', trigger: scope, duration: 1 });
    if (rule) drawLine(rule, scope);
    if (ledeEl) fadeIn(ledeEl, { variant: 'blur', trigger: scope, delay: 0.35 });
  }, []);

  return (
    <div
      ref={scopeRef}
      className={cn('flex flex-col gap-8', align === 'center' && 'items-center text-center', className)}
    >
      <div
        data-header-meta
        className={cn(
          'flex items-center gap-5',
          align === 'center' && 'justify-center',
        )}
      >
        <span className="font-mono text-micro text-gold">{index}</span>
        <span className="eyebrow">{eyebrow}</span>
      </div>

      <div
        data-header-rule
        aria-hidden="true"
        className="h-px w-full origin-left bg-gradient-to-r from-hairline via-hairline to-transparent"
      />

      <AnimatedText
        as="h2"
        variant={variant}
        className={cn('max-w-[18ch] text-title font-medium text-bone', align === 'center' && 'max-w-none', titleClassName)}
      >
        {title}
      </AnimatedText>

      {lede ? (
        <p
          data-header-lede
          className={cn(
            'max-w-[52ch] text-lede text-mist',
            align === 'center' && 'mx-auto text-center',
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
