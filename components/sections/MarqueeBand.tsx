'use client';

import { fadeIn } from '@/animations/reveals';
import { Marquee } from '@/components/ui/Marquee';
import { MARQUEE_ROWS } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

/**
 * The band between hero and narrative.
 *
 * Two rows travelling in opposite directions at different speeds — the counter
 * motion is what stops a marquee reading as a banner. Row two is rendered as
 * outlined type so the pair sit at different depths.
 */
export function MarqueeBand({ className }: { className?: string }) {
  const sectionRef = useGsapScope<HTMLElement>((section) => {
    if (prefersReducedMotion()) return;
    fadeIn(section.querySelectorAll('[data-marquee-row]'), {
      variant: 'blur',
      trigger: section,
      stagger: 0.15,
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Disciplines and partners"
      className={cn(
        'relative flex flex-col gap-6 overflow-hidden border-y border-hairline/60 bg-ink py-14 lg:py-20',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_50%_50%,rgba(216,176,106,0.08),transparent_70%)]"
      />

      <div data-marquee-row className="relative">
        <Marquee
          items={MARQUEE_ROWS[0].items}
          direction={MARQUEE_ROWS[0].direction}
          speed={MARQUEE_ROWS[0].speed}
          itemClassName="text-[clamp(2rem,6vw,5rem)] font-medium uppercase tracking-[-0.03em] text-bone"
        />
      </div>

      <div data-marquee-row className="relative">
        <Marquee
          items={MARQUEE_ROWS[1].items}
          direction={MARQUEE_ROWS[1].direction}
          speed={MARQUEE_ROWS[1].speed}
          itemClassName={cn(
            'text-[clamp(2rem,6vw,5rem)] font-medium uppercase tracking-[-0.03em]',
            // Outlined type: the second row reads as a shadow of the first.
            'text-transparent [-webkit-text-stroke:1px_var(--color-fog)]',
          )}
        />
      </div>

      {/* Edge fades so items dissolve rather than clip at the viewport bounds. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent lg:w-48"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent lg:w-48"
      />
    </section>
  );
}
