import { EASE, gsap } from '@/animations/core';

export type StackElements = {
  pinTarget: HTMLElement;
  cards: HTMLElement[];
  progressBar: HTMLElement | null;
};

/** The dim overlay each card carries, used instead of a `filter`. */
const dimOf = (card: HTMLElement) => card.querySelector<HTMLElement>('[data-card-dim]');

/**
 * Pinned card stack.
 *
 * Each card slides up over the one below while that one recedes — scaled down,
 * pushed back, rotated a degree and dimmed. Because the outgoing card keeps a
 * sliver visible, the stack reads as physical depth rather than a series of
 * full-screen swaps.
 *
 * The dimming is an overlay's opacity, not `filter: brightness()`. This
 * timeline is scrubbed, and a filter would force the browser to re-rasterise
 * every card in the deck — artwork, glass surface and all — on each scroll
 * frame. Opacity on a solid overlay is a compositor-only property, so the
 * whole stack stays on the GPU.
 */
export function buildCardStack({ pinTarget, cards, progressBar }: StackElements) {
  if (cards.length < 2) return null;

  cards.forEach((card, index) => {
    gsap.set(card, {
      zIndex: index,
      yPercent: index === 0 ? 0 : 106,
      scale: 1,
      rotate: 0,
    });

    const dim = dimOf(card);
    if (dim) gsap.set(dim, { opacity: 0 });
  });

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      // Trigger on the element being pinned — the section starts a header's
      // worth of scroll earlier, which would pin the deck below the fold.
      trigger: pinTarget,
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.9 * (cards.length - 1)}`,
      pin: pinTarget,
      pinSpacing: true,
      scrub: 0.85,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progressBar) gsap.set(progressBar, { scaleX: self.progress });
      },
    },
  });

  cards.forEach((card, index) => {
    if (index === 0) return;

    const previous = cards[index - 1]!;
    const at = index - 1;

    timeline
      .to(card, { yPercent: 0, duration: 1, ease: EASE.soft }, at)
      .to(
        previous,
        {
          scale: 0.9 - index * 0.012,
          yPercent: -7,
          rotate: index % 2 === 0 ? 1.6 : -1.6,
          duration: 1,
          ease: EASE.soft,
        },
        at,
      );

    const previousDim = dimOf(previous);
    if (previousDim) {
      timeline.to(previousDim, { opacity: 0.62, duration: 1, ease: EASE.soft }, at);
    }

    // Inside a pin the card never moves in document space, so a viewport-based
    // reveal would fire before it slides in. Ride the scrub instead — different
    // targets to the stack tweens, so no property is written twice.
    const parts = gsap.utils.toArray<HTMLElement>('[data-card-part]', card);
    if (parts.length) {
      timeline.from(
        parts,
        { y: 44, autoAlpha: 0, duration: 0.55, stagger: 0.06, ease: EASE.luxe },
        at + 0.3,
      );
    }
  });

  return timeline;
}

/**
 * Entrance for the cards' inner content, played once as each card lands.
 * Kept separate from the stack so the scrubbed and time-based motion never
 * share a target property.
 *
 * `pinnedContainer` must be passed whenever the cards live inside a pinned
 * element: without it ScrollTrigger measures each card against its unpinned
 * document position, so every reveal fires at once the moment the pin starts.
 */
export function attachCardContentReveal(cards: HTMLElement[], pinnedContainer?: HTMLElement) {
  return cards.map((card) => {
    const parts = gsap.utils.toArray<HTMLElement>('[data-card-part]', card);
    if (!parts.length) return null;

    return gsap.from(parts, {
      y: 44,
      autoAlpha: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: EASE.luxe,
      scrollTrigger: { trigger: card, start: 'top 92%', once: true, pinnedContainer },
    });
  });
}

/** Flowing (non-pinned) variant for small screens. */
export function buildCardFlow(cards: HTMLElement[]) {
  return cards.map((card) =>
    gsap.from(card, {
      yPercent: 12,
      scale: 0.94,
      autoAlpha: 0,
      duration: 1.2,
      ease: EASE.luxe,
      scrollTrigger: { trigger: card, start: 'top 88%', once: true },
    }),
  );
}
