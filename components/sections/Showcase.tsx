'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { BREAKPOINTS, gsap } from '@/animations/core';
import { buildHorizontalShowcase, buildShowcaseCarousel } from '@/animations/showcase';
import { useCursorTarget } from '@/components/providers/CursorProvider';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { PROJECTS } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';

/**
 * Work — the pinned horizontal gallery.
 *
 * Desktop: the section pins and vertical scroll translates the track sideways.
 * Touch: the same markup becomes a native snap carousel, which is both cheaper
 * and the interaction people actually expect on a phone.
 */
export function Showcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragCursor = useCursorTarget('drag', 'Scroll');
  const viewCursor = useCursorTarget('view', 'View');

  const sectionRef = useGsapScope<HTMLElement>((section) => {
    const media = gsap.matchMedia();

    media.add(
      {
        pinned: `${BREAKPOINTS.desktop} and ${BREAKPOINTS.motionOk}`,
        carousel: `(max-width: 1023px) and ${BREAKPOINTS.motionOk}`,
      },
      (context) => {
        const { pinned } = context.conditions as Record<string, boolean>;
        const cards = gsap.utils.toArray<HTMLElement>('[data-showcase-card]', section);
        const track = trackRef.current;

        if (pinned && track) {
          buildHorizontalShowcase({
            section,
            track,
            cards,
            progressBar: section.querySelector('[data-showcase-progress]'),
            counter: section.querySelector('[data-showcase-counter]'),
          });
          return;
        }

        buildShowcaseCarousel(cards);
      },
    );

    return () => media.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="work"
      className="relative overflow-hidden bg-void py-28 lg:h-[100svh] lg:overflow-visible lg:py-0"
      {...dragCursor}
    >
      <div className="relative flex h-full flex-col justify-center gap-14 lg:gap-16">
        {/* ---- Masthead --------------------------------------------------- */}
        <div className="container-luxe flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <span className="font-mono text-micro text-gold">04</span>
              <span className="eyebrow">Selected work</span>
            </div>

            <AnimatedText
              as="h2"
              variant="chars-right"
              className="max-w-[16ch] text-title font-medium text-bone"
            >
              Commissions that earned their silence.
            </AnimatedText>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-mono text-lg text-bone">
              <span data-showcase-counter>01</span>
              <span className="text-fog"> / {String(PROJECTS.length).padStart(2, '0')}</span>
            </span>
            <span className="eyebrow hidden lg:inline">Scroll to advance</span>
          </div>
        </div>

        {/* ---- Track ------------------------------------------------------ */}
        <div className="relative w-full overflow-hidden max-lg:overflow-x-auto max-lg:snap-x max-lg:snap-mandatory max-lg:[scrollbar-width:none]">
          <div
            ref={trackRef}
            className="flex w-max gap-6 px-[var(--spacing-gutter)] will-change-transform md:gap-10"
          >
            {PROJECTS.map((project) => (
              <article
                key={project.id}
                data-showcase-card
                className="group relative w-[78vw] shrink-0 snap-center sm:w-[62vw] md:w-[44vw] lg:w-[32vw] xl:w-[28vw]"
                {...viewCursor}
              >
                <figure className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] rim reflect">
                  {/* The media layer is over-scaled so its parallax travel
                      never exposes the frame edge. */}
                  <div data-showcase-media className="absolute inset-0 scale-[1.16] will-change-transform">
                    <Image
                      src={project.artwork.src}
                      alt={project.artwork.alt}
                      fill
                      sizes="(max-width: 768px) 78vw, (max-width: 1024px) 44vw, 30vw"
                      placeholder="blur"
                      blurDataURL={project.artwork.blurDataURL}
                      className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-transparent" />

                  <figcaption className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                    <div className="overflow-hidden">
                      <span
                        data-showcase-part
                        className="block eyebrow text-bone/80"
                      >
                        {project.category}
                      </span>
                    </div>
                    <span className="font-mono text-micro text-gold">{project.year}</span>
                  </figcaption>
                </figure>

                <div className="mt-7 flex flex-col gap-4">
                  <div className="flex items-baseline gap-4 overflow-hidden">
                    <span className="font-mono text-micro text-gold">{project.index}</span>
                    <h3
                      data-showcase-part
                      className="text-heading font-medium text-bone transition-colors duration-500 group-hover:text-gold-soft"
                    >
                      {project.name}
                    </h3>
                  </div>

                  <div className="overflow-hidden">
                    <p data-showcase-part className="max-w-[38ch] text-sm leading-relaxed text-mist">
                      {project.description}
                    </p>
                  </div>

                  {/* Underline that draws on hover. */}
                  <span
                    aria-hidden="true"
                    className="h-px w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ---- Progress --------------------------------------------------- */}
        <div className="container-luxe hidden lg:block">
          <div className="h-px w-full overflow-hidden bg-hairline">
            <div
              data-showcase-progress
              className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-gold-soft"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
