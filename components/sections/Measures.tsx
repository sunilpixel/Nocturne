'use client';

import { gsap } from '@/animations/core';
import { fadeIn, parallax } from '@/animations/reveals';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { Counter, ProgressBar, ProgressRing } from '@/components/ui/Counter';
import { PERFORMANCE_RING, STATS } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * Measures — the statistics band.
 *
 * Counters, bars and the ring all trigger independently as they enter, on a
 * slight cascade, so the section resolves in waves instead of everything
 * firing at once.
 */
export function Measures() {
  const sectionRef = useGsapScope<HTMLElement>((section) => {
    if (prefersReducedMotion()) return;

    const rows = gsap.utils.toArray<HTMLElement>('[data-stat-row]', section);
    fadeIn(rows, { variant: 'up', trigger: section, stagger: 0.12 });

    const glow = section.querySelector<HTMLElement>('[data-measures-glow]');
    if (glow) parallax(glow, { strength: 22, trigger: section });

    const ring = section.querySelector<HTMLElement>('[data-measures-ring]');
    if (ring) fadeIn(ring, { variant: 'scale', trigger: ring, duration: 1.4 });
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-void py-28 lg:py-40">
      <div
        data-measures-glow
        aria-hidden="true"
        // Blur-free: this glow is parallaxed on scrub, and a filter here would
        // re-rasterise a 46rem surface on every scroll frame.
        className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,176,106,0.12),transparent_68%)]"
      />

      <div className="container-luxe relative">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <span className="font-mono text-micro text-gold">—</span>
            <span className="eyebrow">By the numbers</span>
          </div>

          <AnimatedText
            as="h2"
            variant="words-scale"
            className="max-w-[20ch] text-title font-medium text-bone"
          >
            Ten years of quiet, measurable obsession.
          </AnimatedText>
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-20">
          {/* ---- Numeric rows -------------------------------------------- */}
          <dl className="flex flex-col lg:col-span-7">
            {STATS.map((stat, index) => (
              <div
                key={stat.id}
                data-stat-row
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-8 gap-y-4 border-t border-hairline py-8 md:grid-cols-[10rem_1fr_auto]"
              >
                <dd className="font-mono text-[clamp(2.5rem,5vw,4rem)] font-light leading-none text-bone transition-colors duration-700 group-hover:text-gold-soft">
                  <Counter value={stat.value} suffix={stat.suffix} delay={index * 0.08} />
                </dd>

                <div className="flex flex-col gap-3">
                  <dt className="text-lede text-bone">{stat.label}</dt>
                  <span className="eyebrow">{stat.detail}</span>
                </div>

                <div className="col-span-2 w-full md:col-span-1 md:w-40">
                  <ProgressBar progress={stat.progress} delay={index * 0.08} />
                </div>
              </div>
            ))}
            <div className="border-t border-hairline" />
          </dl>

          {/* ---- Ring ----------------------------------------------------- */}
          <div
            data-measures-ring
            className="flex flex-col items-center gap-8 lg:col-span-5 lg:items-start"
          >
            <ProgressRing progress={PERFORMANCE_RING.progress} size={260} strokeWidth={2}>
              <span className="font-mono text-[3.2rem] font-light leading-none text-bone">
                <Counter value={PERFORMANCE_RING.value} />
              </span>
              <span className="mt-2 eyebrow text-gold">{PERFORMANCE_RING.suffix}</span>
            </ProgressRing>

            <div className="flex max-w-[34ch] flex-col gap-4 text-center lg:text-left">
              <h3 className="text-heading font-medium text-bone">{PERFORMANCE_RING.label}</h3>
              <p className="text-sm leading-relaxed text-mist">{PERFORMANCE_RING.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
