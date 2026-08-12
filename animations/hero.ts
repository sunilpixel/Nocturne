import { DURATION, EASE, gsap } from '@/animations/core';
import { splitText } from '@/animations/text';
import { isTouchDevice } from '@/lib/utils';

export type HeroElements = {
  eyebrow: HTMLElement | null;
  headline: HTMLElement | null;
  lede: HTMLElement | null;
  actions: HTMLElement[];
  meta: HTMLElement[];
  plates: HTMLElement[];
  scrollCue: HTMLElement | null;
};

/**
 * The hero entrance.
 *
 * Deliberately overlapped rather than sequenced: the plates start their clip
 * reveal while the headline characters are still arriving, and the lede begins
 * before the plates finish. Nothing waits its turn, which is what separates a
 * composed opening from a checklist of animations.
 */
export function buildHeroIntro(elements: HeroElements) {
  const { eyebrow, headline, lede, actions, meta, plates, scrollCue } = elements;

  const reverts: Array<() => void> = [];
  const timeline = gsap.timeline({ defaults: { ease: EASE.luxe } });

  if (eyebrow) {
    timeline.from(eyebrow, { yPercent: 120, autoAlpha: 0, duration: 1 }, 0);
  }

  if (headline) {
    const { targets, revert } = splitText(headline, 'chars-up');
    reverts.push(revert);

    gsap.set(headline, { autoAlpha: 1, perspective: 900 });

    timeline.from(
      targets,
      {
        yPercent: 120,
        rotateX: -55,
        autoAlpha: 0,
        transformOrigin: '50% 100%',
        duration: DURATION.slow,
        stagger: { each: 0.016, from: 'start' },
      },
      0.1,
    );

    // The accent word arrives a beat late and slightly larger — it should read
    // as the emphasis in the sentence, not just another word.
    const accent = headline.querySelector<HTMLElement>('[data-accent]');
    if (accent) {
      timeline.from(
        accent,
        { scale: 1.35, filter: 'blur(16px)', duration: DURATION.cinematic, ease: EASE.drama },
        0.35,
      );
      timeline.set(accent, { clearProps: 'filter' });
    }
  }

  if (plates.length) {
    timeline.fromTo(
      plates,
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1,
        duration: DURATION.cinematic,
        ease: EASE.drama,
        stagger: 0.16,
      },
      0.5,
    );
  }

  if (lede) {
    const { targets, revert } = splitText(lede, 'words-up');
    reverts.push(revert);
    gsap.set(lede, { autoAlpha: 1 });
    timeline.from(targets, { yPercent: 110, autoAlpha: 0, duration: 1, stagger: 0.028 }, 0.85);
  }

  if (actions.length) {
    timeline.from(actions, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1 }, 1.05);
  }

  if (meta.length) {
    timeline.from(meta, { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 1.2);
  }

  if (scrollCue) {
    timeline.from(scrollCue, { autoAlpha: 0, y: 24, duration: 1 }, 1.4);
  }

  return {
    timeline,
    revert: () => reverts.forEach((fn) => fn()),
  };
}

/**
 * Endless idle motion. Each plate gets its own duration and phase so they never
 * fall into step — a synchronised bob immediately reads as fake.
 */
export function attachHeroFloat(plates: HTMLElement[]) {
  return plates.map((plate, index) =>
    gsap.to(plate, {
      y: index % 2 === 0 ? -22 : 18,
      rotate: index % 2 === 0 ? -1.4 : 1.1,
      duration: 5 + index * 1.35,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: index * 0.4,
    }),
  );
}

/**
 * Departure: as the hero scrolls away it recedes rather than simply leaving —
 * scale and fade tied to scroll position, with the plates travelling at a
 * different rate to open up depth.
 *
 * Note the absence of a blur. A scrubbed `filter: blur()` re-rasterises the
 * entire hero — headline, plates, background stack — on every scroll frame,
 * which is the most expensive thing this page could ask a compositor to do.
 * Scale plus opacity reads as the same recession and stays on the GPU.
 */
export function attachHeroDeparture(section: HTMLElement, content: HTMLElement, plates: HTMLElement[]) {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
    },
  });

  timeline.to(content, { yPercent: -18, scale: 0.9, autoAlpha: 0.12, ease: 'none' }, 0);

  if (plates.length) {
    timeline.to(plates, { yPercent: -38, ease: 'none', stagger: 0.05 }, 0);
  }

  return timeline;
}

/** Background layers drift at fractional rates to fake camera depth. */
export function attachHeroParallax(section: HTMLElement, layers: HTMLElement[]) {
  return layers.map((layer, index) =>
    gsap.to(layer, {
      yPercent: 12 + index * 9,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
    }),
  );
}

/**
 * Pointer spotlight — a soft light that trails the cursor across the hero.
 * Bound to the section, skipped on touch, and torn down with the scope.
 */
export function attachSpotlight(section: HTMLElement, spotlight: HTMLElement) {
  if (isTouchDevice()) return () => {};

  const moveX = gsap.quickTo(spotlight, 'x', { duration: 1.1, ease: EASE.luxe });
  const moveY = gsap.quickTo(spotlight, 'y', { duration: 1.1, ease: EASE.luxe });

  const handleMove = (event: PointerEvent) => {
    const rect = section.getBoundingClientRect();
    moveX(event.clientX - rect.left);
    moveY(event.clientY - rect.top);
  };

  const handleEnter = () => gsap.to(spotlight, { autoAlpha: 1, duration: 0.8 });
  const handleLeave = () => gsap.to(spotlight, { autoAlpha: 0, duration: 0.8 });

  section.addEventListener('pointermove', handleMove, { passive: true });
  section.addEventListener('pointerenter', handleEnter);
  section.addEventListener('pointerleave', handleLeave);

  return () => {
    section.removeEventListener('pointermove', handleMove);
    section.removeEventListener('pointerenter', handleEnter);
    section.removeEventListener('pointerleave', handleLeave);
  };
}
