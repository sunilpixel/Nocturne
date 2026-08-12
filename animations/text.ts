import SplitType from 'split-type';

import { DURATION, EASE, gsap, ScrollTrigger } from '@/animations/core';

/**
 * The catalogue of text entrances. Each section picks a different one so no two
 * headings arrive the same way — that variation is most of what makes a page
 * feel authored rather than templated.
 */
export type TextRevealVariant =
  | 'chars-up'
  | 'chars-right'
  | 'chars-left'
  | 'chars-blur'
  | 'chars-rotate'
  | 'words-up'
  | 'words-right'
  | 'words-scale'
  | 'lines-up'
  | 'lines-mask';

type SplitTypeKind = 'chars' | 'words' | 'lines';

const VARIANT_TARGET: Record<TextRevealVariant, SplitTypeKind> = {
  'chars-up': 'chars',
  'chars-right': 'chars',
  'chars-left': 'chars',
  'chars-blur': 'chars',
  'chars-rotate': 'chars',
  'words-up': 'words',
  'words-right': 'words',
  'words-scale': 'words',
  'lines-up': 'lines',
  'lines-mask': 'lines',
};

/** `from` state per variant. Everything animates back to a clean identity. */
const VARIANT_FROM: Record<TextRevealVariant, gsap.TweenVars> = {
  'chars-up': { yPercent: 110, opacity: 0 },
  'chars-right': { xPercent: 60, opacity: 0, filter: 'blur(6px)' },
  'chars-left': { xPercent: -60, opacity: 0, filter: 'blur(6px)' },
  'chars-blur': { opacity: 0, filter: 'blur(14px)', scale: 1.25 },
  'chars-rotate': { yPercent: 90, rotateX: -80, opacity: 0, transformOrigin: '50% 100%' },
  'words-up': { yPercent: 120, opacity: 0 },
  'words-right': { xPercent: 40, opacity: 0, filter: 'blur(8px)' },
  'words-scale': { scale: 0.7, opacity: 0, filter: 'blur(10px)' },
  'lines-up': { yPercent: 105, opacity: 0 },
  'lines-mask': { yPercent: 105, opacity: 0, skewY: 4 },
};

const VARIANT_STAGGER: Record<TextRevealVariant, number> = {
  'chars-up': 0.018,
  'chars-right': 0.014,
  'chars-left': 0.014,
  'chars-blur': 0.012,
  'chars-rotate': 0.02,
  'words-up': 0.045,
  'words-right': 0.05,
  'words-scale': 0.055,
  'lines-up': 0.09,
  'lines-mask': 0.1,
};

export type SplitResult = {
  split: SplitType;
  targets: HTMLElement[];
  revert: () => void;
};

/**
 * Split an element and hand back its animatable pieces.
 * Always splits down to lines so line-level masking is available, regardless of
 * which granularity the variant animates.
 */
export function splitText(element: HTMLElement, variant: TextRevealVariant): SplitResult {
  const kind = VARIANT_TARGET[variant];
  const types: SplitTypeKind[] = kind === 'chars' ? ['lines', 'words', 'chars'] : kind === 'words' ? ['lines', 'words'] : ['lines'];

  const split = new SplitType(element, {
    types: types.join(',') as 'lines,words,chars',
    tagName: 'span',
  });

  element.classList.add('split-lines');
  if (kind === 'chars') element.classList.add('split-chars');

  const targets = (split[kind] ?? []) as HTMLElement[];

  return {
    split,
    targets,
    revert: () => {
      split.revert();
      element.classList.remove('split-lines', 'split-chars');
    },
  };
}

export type TextRevealOptions = {
  variant?: TextRevealVariant;
  delay?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
  /** When false the caller drives playback (e.g. a preloader timeline). */
  scrollTrigger?: boolean | ScrollTrigger.Vars;
  paused?: boolean;
};

/**
 * Build the reveal timeline for an already-split element.
 * Returns a paused-or-triggered timeline the caller owns.
 */
export function buildTextReveal(
  targets: HTMLElement[],
  element: HTMLElement,
  options: TextRevealOptions = {},
): gsap.core.Timeline {
  const {
    variant = 'lines-up',
    delay = 0,
    duration = DURATION.slow,
    ease = EASE.luxe,
    stagger = VARIANT_STAGGER[variant],
    scrollTrigger = true,
    paused = false,
  } = options;

  const needsPerspective = variant === 'chars-rotate';

  const timeline = gsap.timeline({
    paused,
    delay,
    defaults: { duration, ease },
    scrollTrigger:
      scrollTrigger === false
        ? undefined
        : {
            trigger: element,
            start: 'top 85%',
            once: true,
            ...(typeof scrollTrigger === 'object' ? scrollTrigger : {}),
          },
  });

  if (needsPerspective) {
    gsap.set(element, { perspective: 800 });
  }

  timeline
    .set(element, { autoAlpha: 1 })
    .from(targets, {
      ...VARIANT_FROM[variant],
      stagger,
      // Clearing the filter avoids a permanent compositing layer on text.
      onComplete: () => gsap.set(targets, { clearProps: 'filter' }),
    });

  return timeline;
}

/**
 * Convenience wrapper: split, animate, and return a single revert function.
 * Used by useTextReveal; also callable directly from a parent timeline.
 */
export function createTextReveal(element: HTMLElement, options: TextRevealOptions = {}) {
  const variant = options.variant ?? 'lines-up';
  const { targets, revert } = splitText(element, variant);
  const timeline = buildTextReveal(targets, element, options);

  return {
    timeline,
    targets,
    revert: () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      revert();
      gsap.set(element, { clearProps: 'all' });
    },
  };
}

/** Gold the hovered letter settles on — matches --color-gold in globals.css. */
const CHAR_HOVER_GOLD = '#d8b06a';

/**
 * Per-character proximity hover.
 *
 * Every letter responds to how near the pointer actually is to *it*, so the
 * wordmark deforms around the cursor like a soft field rather than lifting as
 * one rigid block. The letter directly under the pointer takes the full lift
 * and turns gold; its neighbours take a fraction on a smoothstep falloff, which
 * is what produces the wave instead of a stepped, letter-by-letter jump.
 *
 * Returns a teardown that removes its own listeners.
 */
export function attachCharHover(element: HTMLElement) {
  // No hover on touch: pointermove there would fire only mid-drag and leave the
  // wordmark stuck in whatever state the last touch produced.
  if (!window.matchMedia('(hover: hover)').matches) return () => {};

  const { targets, revert } = splitText(element, 'chars-up');
  if (!targets.length) return revert;

  // splitText installs the line mask, whose `overflow: hidden` exists so
  // entrance reveals can slide letters up from behind a clean edge. That same
  // clip decapitates a hover lift, so this effect opts out of it.
  element.classList.remove('split-lines');

  gsap.set(targets, { transformOrigin: '50% 100%', display: 'inline-block' });

  // Resolved before anything is tweened, so letters have a concrete colour to
  // return to — GSAP cannot interpolate back to an empty string.
  const restColor = getComputedStyle(targets[0]).color;

  /** Falloff radius, in multiples of the font size — scales with the clamp. */
  const RADIUS_EM = 1.5;
  const LIFT = -26;
  const SCALE = 0.24;

  const setY = targets.map((char) => gsap.quickTo(char, 'yPercent', { duration: 0.5, ease: EASE.luxe }));
  const setScale = targets.map((char) => gsap.quickTo(char, 'scale', { duration: 0.5, ease: EASE.luxe }));

  let centres: number[] = [];
  let originX = 0;
  let radius = 120;
  let nearest = -1;

  /**
   * Cached because it is pure layout reading. Doing it per pointermove would
   * force a synchronous reflow on every mouse event across a wordmark that can
   * be 15rem tall.
   */
  const measure = () => {
    const rect = element.getBoundingClientRect();
    originX = rect.left;
    radius = Number.parseFloat(getComputedStyle(element).fontSize) * RADIUS_EM;
    centres = targets.map((char) => {
      const charRect = char.getBoundingClientRect();
      return charRect.left + charRect.width / 2 - rect.left;
    });
  };

  const move = (event: PointerEvent) => {
    const x = event.clientX - originX;
    let closest = -1;
    let closestDistance = Infinity;

    for (let i = 0; i < targets.length; i += 1) {
      const distance = Math.abs(x - centres[i]);
      // Smoothstep: eases the influence in at the edge of the radius so a
      // letter never snaps into the wave as the pointer crosses its threshold.
      const t = Math.max(0, 1 - distance / radius);
      const influence = t * t * (3 - 2 * t);

      setY[i](LIFT * influence);
      setScale[i](1 + SCALE * influence);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = i;
      }
    }

    // Colour is switched on the single nearest letter rather than interpolated
    // across all of them: one tween per letter-crossing instead of a colour
    // parse per character per pointer event.
    if (closest !== nearest) {
      if (nearest >= 0) gsap.to(targets[nearest], { color: restColor, duration: 0.4, ease: EASE.luxe });
      gsap.to(targets[closest], { color: CHAR_HOVER_GOLD, duration: 0.3, ease: EASE.luxe });
      nearest = closest;
    }
  };

  const leave = () => {
    targets.forEach((char, i) => {
      setY[i](0);
      setScale[i](1);
      gsap.to(char, { color: restColor, duration: 0.5, ease: EASE.luxe });
    });
    nearest = -1;
  };

  measure();

  // Re-measure on layout change only — the wordmark is fluid-sized, so a
  // viewport resize moves every centre.
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(element);

  element.addEventListener('pointerenter', measure);
  element.addEventListener('pointermove', move, { passive: true });
  element.addEventListener('pointerleave', leave);

  return () => {
    element.removeEventListener('pointerenter', measure);
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerleave', leave);
    resizeObserver.disconnect();
    gsap.killTweensOf(targets);
    revert();
  };
}
