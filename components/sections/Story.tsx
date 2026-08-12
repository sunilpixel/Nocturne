'use client';

import Image from 'next/image';

import { BREAKPOINTS, gsap } from '@/animations/core';
import { buildStoryFallback, buildStoryTimeline, type StoryElements } from '@/animations/story';
import { STORY_CHAPTERS } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn } from '@/lib/utils';

/**
 * Ethos — the pinned narrative.
 *
 * Desktop pins the section and scrubs one master timeline; small screens get a
 * flowing variant. gsap.matchMedia owns the switch, so rotating a tablet
 * rebuilds the correct version and disposes the other one cleanly.
 */
export function Story() {
  const sectionRef = useGsapScope<HTMLElement>((section) => {
    const collect = (): StoryElements => ({
      section,
      chapters: gsap.utils.toArray<HTMLElement>('[data-story-chapter]', section),
      frames: gsap.utils.toArray<HTMLElement>('[data-story-frame]', section),
      progressBar: section.querySelector('[data-story-progress]'),
      counter: section.querySelector('[data-story-counter]'),
      markers: gsap.utils.toArray<HTMLElement>('[data-story-marker]', section),
    });

    const media = gsap.matchMedia();

    media.add(
      {
        pinned: `${BREAKPOINTS.desktop} and ${BREAKPOINTS.motionOk}`,
        flowing: `(max-width: 1023px) and ${BREAKPOINTS.motionOk}`,
        still: BREAKPOINTS.motionReduced,
      },
      (context) => {
        const { pinned, flowing } = context.conditions as Record<string, boolean>;
        const elements = collect();

        if (pinned) {
          buildStoryTimeline(elements);
          return;
        }

        if (flowing) {
          buildStoryFallback(elements);
          return;
        }

        // Reduced motion — render the finished state.
        gsap.set('[data-story-part]', { xPercent: 0, autoAlpha: 1 });
        gsap.set('[data-story-frame]', { clipPath: 'inset(0% 0% 0% 0%)' });
      },
    );

    return () => media.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ethos"
      className="relative overflow-hidden bg-void py-28 lg:h-[100svh] lg:overflow-visible lg:py-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,rgba(216,176,106,0.07),transparent_60%)]"
      />

      <div className="container-luxe relative flex h-full flex-col justify-center gap-16 lg:gap-0">
        {/* ---- Rail: index, progress, chapter markers --------------------- */}
        <div className="flex items-center justify-between lg:absolute lg:inset-y-0 lg:left-[var(--spacing-gutter)] lg:w-24 lg:flex-col lg:items-start lg:justify-center lg:gap-8">
          <div className="flex items-baseline gap-2">
            <span data-story-counter className="font-mono text-lg text-gold">
              01
            </span>
            <span className="font-mono text-lg text-fog">/ {String(STORY_CHAPTERS.length).padStart(2, '0')}</span>
          </div>

          <div className="hidden h-40 w-px bg-hairline lg:block">
            <div
              data-story-progress
              className="h-full w-full origin-top scale-y-0 bg-gradient-to-b from-gold-soft to-gold-deep"
            />
          </div>

          <ul className="flex gap-2 lg:flex-col lg:gap-3">
            {STORY_CHAPTERS.map((chapter, index) => (
              <li key={chapter.id}>
                <span
                  data-story-marker
                  className={cn(
                    'block h-px w-10 origin-left bg-gold lg:w-8',
                    index === 0 ? 'opacity-100' : 'scale-x-[0.25] opacity-35',
                  )}
                />
                <span className="sr-only">{chapter.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Chapters --------------------------------------------------- */}
        <div className="grid gap-16 lg:h-full lg:grid-cols-12 lg:items-center lg:gap-12 lg:pl-32">
          {/* Copy column: on desktop every chapter stacks in this one box. */}
          <div className="relative flex flex-col gap-16 lg:col-span-6 lg:block lg:h-[26rem] lg:gap-0">
            {STORY_CHAPTERS.map((chapter) => (
              <article
                key={chapter.id}
                data-story-chapter
                className="flex flex-col gap-6 lg:absolute lg:inset-0 lg:justify-center"
              >
                <div data-story-part className="flex items-center gap-4 will-change-transform">
                  <span className="font-mono text-micro text-gold">{chapter.index}</span>
                  <span className="eyebrow">{chapter.caption}</span>
                </div>

                <h3
                  data-story-part
                  className="text-title font-medium text-bone will-change-transform"
                >
                  {chapter.title}{' '}
                  <span className="font-serif italic lowercase text-gradient">{chapter.accent}</span>
                </h3>

                <p
                  data-story-part
                  className="max-w-[46ch] text-lede text-mist will-change-transform"
                >
                  {chapter.body}
                </p>

                <div
                  data-story-part
                  aria-hidden="true"
                  className="h-px w-24 bg-gradient-to-r from-gold to-transparent will-change-transform"
                />
              </article>
            ))}
          </div>

          {/* Artwork column: frames wipe over one another. */}
          <div className="relative aspect-[4/5] w-full lg:col-span-6 lg:h-[34rem] lg:aspect-auto">
            {STORY_CHAPTERS.map((chapter, index) => (
              <figure
                key={chapter.id}
                data-story-frame
                className="group absolute inset-0 overflow-hidden rounded-[1.75rem] rim"
              >
                <Image
                  src={chapter.artwork.src}
                  alt={chapter.artwork.alt}
                  fill
                  sizes="(max-width: 1024px) 92vw, 42vw"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  placeholder="blur"
                  blurDataURL={chapter.artwork.blurDataURL}
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/75 via-transparent to-transparent" />
                <figcaption className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <span className="eyebrow text-bone/70">{chapter.caption}</span>
                  <span className="font-mono text-micro text-gold">{chapter.index}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
