'use client';

import Image from 'next/image';

import { EASE, gsap } from '@/animations/core';
import { parallax } from '@/animations/reveals';
import { useCursor } from '@/components/providers/CursorProvider';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ARCHIVE_PLATES } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

const SPAN_CLASSES: Record<string, string> = {
  tall: 'aspect-[3/4]',
  wide: 'aspect-[4/3]',
  normal: 'aspect-square',
};

/**
 * Archive — a masonry wall with a cursor preview.
 *
 * Layout uses CSS columns rather than a JS masonry library: it reflows for free
 * at every breakpoint and costs nothing at runtime. Each plate reveals with a
 * clip-path curtain and then parallaxes independently, so the wall never scrolls
 * as a single rigid sheet.
 */
export function Archive() {
  const cursor = useCursor();

  const sectionRef = useGsapScope<HTMLElement>((section) => {
    if (prefersReducedMotion()) return;

    const plates = gsap.utils.toArray<HTMLElement>('[data-plate]', section);

    plates.forEach((plate, index) => {
      const frame = plate.querySelector<HTMLElement>('[data-plate-frame]');
      const media = plate.querySelector<HTMLElement>('[data-plate-media]');
      const caption = plate.querySelector<HTMLElement>('[data-plate-caption]');

      if (frame) {
        gsap.fromTo(
          frame,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.5,
            ease: EASE.drama,
            // Alternating delay breaks the diagonal that a uniform stagger
            // draws across a masonry grid.
            delay: (index % 3) * 0.12,
            scrollTrigger: { trigger: plate, start: 'top 88%', once: true },
          },
        );
      }

      if (media) {
        parallax(media, { strength: 7 + (index % 3) * 3, trigger: plate });
      }

      if (caption) {
        gsap.from(caption, {
          y: 24,
          autoAlpha: 0,
          duration: 1,
          ease: EASE.luxe,
          scrollTrigger: { trigger: plate, start: 'top 82%', once: true },
        });
      }
    });
  }, []);

  return (
    <section ref={sectionRef} id="archive" className="relative bg-void py-28 lg:py-40">
      <div className="container-luxe">
        <SectionHeader
          index="05"
          eyebrow="The archive"
          title="Fragments from the workbench."
          variant="chars-blur"
          lede="Studies, offcuts and unreleased directions. Hover to look closer."
          className="max-w-3xl"
        />

        <div className="mt-20 columns-1 gap-6 sm:columns-2 lg:columns-3 lg:gap-8">
          {ARCHIVE_PLATES.map((plate) => (
            <figure
              key={plate.id}
              data-plate
              className="group mb-6 break-inside-avoid lg:mb-8"
              onPointerEnter={() => cursor.set({ variant: 'plate', preview: plate.artwork.src })}
              onPointerLeave={() => cursor.reset()}
            >
              <div
                data-plate-frame
                className={cn(
                  'relative w-full overflow-hidden rounded-[1.25rem] rim reflect',
                  SPAN_CLASSES[plate.span],
                )}
              >
                <div data-plate-media className="absolute inset-0 scale-[1.14] will-change-transform">
                  <Image
                    src={plate.artwork.src}
                    alt={plate.artwork.alt}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    placeholder="blur"
                    blurDataURL={plate.artwork.blurDataURL}
                    className="object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.09]"
                  />
                </div>

                {/* Light sweep on hover — sits above the media, below the rim. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(242,221,176,0.18),transparent_70%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/60 to-transparent" />
              </div>

              <figcaption
                data-plate-caption
                className="mt-4 flex items-baseline justify-between gap-4"
              >
                <span className="text-sm text-bone transition-colors duration-500 group-hover:text-gold-soft">
                  {plate.title}
                </span>
                <span className="eyebrow">{plate.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
