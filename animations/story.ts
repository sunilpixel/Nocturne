import { EASE, gsap, ScrollTrigger } from '@/animations/core';

export type StoryElements = {
  section: HTMLElement;
  /** One wrapper per chapter, stacked in the same box. */
  chapters: HTMLElement[];
  /** Artwork frames, index-aligned with `chapters`. */
  frames: HTMLElement[];
  progressBar: HTMLElement | null;
  counter: HTMLElement | null;
  markers: HTMLElement[];
};

/** Scroll distance allotted to each chapter, as a multiple of viewport height. */
const CHAPTER_SCROLL = 1.15;
/** Timeline units per chapter — enter (1) then hold/exit (1). */
const UNIT = 2;

/**
 * The pinned chapter sequence.
 *
 * One scrubbed timeline drives everything. Each chapter's parts enter from the
 * right on a stagger, hold, then leave to the left as the next one arrives —
 * the small overlap between an outgoing and incoming chapter is what makes it
 * feel like one continuous camera move rather than a slideshow.
 *
 * Artwork is wiped in with clip-path over the previous frame (later frames sit
 * higher in the stack), so there is never a blank moment between chapters.
 */
export function buildStoryTimeline(elements: StoryElements) {
  const { section, chapters, frames, progressBar, counter, markers } = elements;
  const total = chapters.length;
  if (!total) return null;

  const partsFor = (chapter: HTMLElement) =>
    gsap.utils.toArray<HTMLElement>('[data-story-part]', chapter);

  // Rest state: everything waiting off to the right, first chapter included —
  // the timeline itself brings chapter one on, so entering the section from
  // above or below always looks identical.
  //
  // No blur in this timeline: it is scrubbed, so a `filter` would re-rasterise
  // every headline and paragraph on each scroll frame for the section's whole
  // pinned length. The horizontal travel already carries the motion.
  chapters.forEach((chapter, index) => {
    gsap.set(partsFor(chapter), { xPercent: 110, autoAlpha: 0 });
    gsap.set(chapter, { zIndex: total - index });
  });

  frames.forEach((frame, index) => {
    gsap.set(frame, {
      clipPath: index === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
      zIndex: index,
    });
  });

  const timeline = gsap.timeline({
    defaults: { ease: EASE.luxe },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * CHAPTER_SCROLL * total}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: 'labels',
        duration: { min: 0.15, max: 0.45 },
        delay: 0.06,
        ease: EASE.inOut,
      },
      onUpdate: (self) => {
        if (progressBar) gsap.set(progressBar, { scaleY: self.progress });

        const active = Math.min(total - 1, Math.floor(self.progress * total));
        if (counter) counter.textContent = String(active + 1).padStart(2, '0');

        markers.forEach((marker, index) => {
          gsap.to(marker, {
            scaleX: index === active ? 1 : 0.25,
            opacity: index === active ? 1 : 0.35,
            duration: 0.4,
            overwrite: 'auto',
          });
        });
      },
    },
  });

  chapters.forEach((chapter, index) => {
    const at = index * UNIT;
    const parts = partsFor(chapter);

    timeline.addLabel(`chapter-${index}`, at);

    // Enter, from the right, part by part.
    timeline.to(
      parts,
      {
        xPercent: 0,
        autoAlpha: 1,
        duration: 1,
        stagger: 0.16,
      },
      at,
    );

    if (index > 0) {
      const frame = frames[index];
      if (frame) {
        timeline.to(
          frame,
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: EASE.drama },
          at - 0.25,
        );
      }
    }

    // Leave, to the left — except the last, which holds while the pin releases.
    if (index < total - 1) {
      timeline.to(
        parts,
        {
          xPercent: -95,
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.07,
          ease: EASE.drama,
        },
        at + 1.15,
      );
    }
  });

  // A final beat of empty timeline so the last chapter is readable before the
  // pin releases rather than snapping away the instant it lands.
  timeline.to({}, { duration: 0.9 });

  return timeline;
}

/**
 * Small-screen fallback: pinning a tall sequence on a phone fights the URL bar
 * and costs more than it delivers, so chapters simply flow and reveal.
 */
export function buildStoryFallback(elements: StoryElements) {
  const { chapters, frames } = elements;

  chapters.forEach((chapter, index) => {
    const parts = gsap.utils.toArray<HTMLElement>('[data-story-part]', chapter);

    // Blur-free for the same reason as the pinned variant, and doubly so here:
    // this branch is the phone/tablet one, where fill rate is scarcest.
    gsap.from(parts, {
      xPercent: 60,
      autoAlpha: 0,
      duration: 1.1,
      stagger: 0.12,
      ease: EASE.luxe,
      scrollTrigger: { trigger: chapter, start: 'top 78%', once: true },
    });

    const frame = frames[index];
    if (frame) {
      gsap.fromTo(
        frame,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.4,
          ease: EASE.drama,
          scrollTrigger: { trigger: frame, start: 'top 82%', once: true },
        },
      );
    }
  });

  return ScrollTrigger.getAll().length;
}
