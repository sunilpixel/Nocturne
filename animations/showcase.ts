import { EASE, gsap } from '@/animations/core';
import { parallaxX } from '@/animations/reveals';

export type ShowcaseElements = {
  section: HTMLElement;
  track: HTMLElement;
  cards: HTMLElement[];
  progressBar: HTMLElement | null;
  counter: HTMLElement | null;
};

/**
 * Pinned horizontal gallery: vertical scroll drives horizontal travel.
 *
 * Distance is measured, not assumed, and recomputed on every refresh — the
 * track width depends on font metrics and card count, so a hard-coded value
 * would drift the moment content changes.
 *
 * Each card's artwork then parallaxes *within* the moving track by passing the
 * master tween as `containerAnimation`, which is what stops the gallery from
 * feeling like one flat sheet sliding past.
 */
export function buildHorizontalShowcase({
  section,
  track,
  cards,
  progressBar,
  counter,
}: ShowcaseElements) {
  const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${getDistance()}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progressBar) gsap.set(progressBar, { scaleX: self.progress });

        if (counter) {
          const active = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
          counter.textContent = String(active).padStart(2, '0');
        }
      },
    },
  });

  cards.forEach((card, index) => {
    const media = card.querySelector<HTMLElement>('[data-showcase-media]');
    const parts = gsap.utils.toArray<HTMLElement>('[data-showcase-part]', card);

    if (media) {
      parallaxX(media, { strength: 9, containerAnimation: tween, trigger: card });
    }

    // Cards lift and settle as they cross the middle of the viewport.
    gsap.fromTo(
      card,
      { yPercent: index % 2 === 0 ? 5 : -5, scale: 0.94 },
      {
        yPercent: 0,
        scale: 1,
        ease: EASE.soft,
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 92%',
          end: 'center 55%',
          scrub: true,
        },
      },
    );

    if (parts.length) {
      gsap.from(parts, {
        yPercent: 130,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: EASE.luxe,
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 88%',
          once: true,
        },
      });
    }
  });

  return tween;
}

/** Touch variant: native horizontal scrolling with snap, no pin, no scrub. */
export function buildShowcaseCarousel(cards: HTMLElement[]) {
  return cards.map((card) =>
    gsap.from(card, {
      autoAlpha: 0,
      y: 40,
      duration: 1,
      ease: EASE.luxe,
      scrollTrigger: { trigger: card, start: 'top 90%', once: true },
    }),
  );
}
