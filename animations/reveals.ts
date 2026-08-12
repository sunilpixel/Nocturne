import { DURATION, EASE, gsap, ScrollTrigger } from '@/animations/core';

/* -------------------------------------------------------------------------- */
/*  Image reveals                                                             */
/* -------------------------------------------------------------------------- */

export type ClipDirection = 'up' | 'down' | 'left' | 'right' | 'center';

const CLIP_FROM: Record<ClipDirection, string> = {
  up: 'inset(100% 0% 0% 0%)',
  down: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
  center: 'inset(50% 0% 50% 0%)',
};

const CLIP_TO = 'inset(0% 0% 0% 0%)';

/**
 * Clip-path curtain plus a counter-scale on the inner media, so the image
 * appears to be uncovered rather than wiped — the difference between a
 * transition and an actual reveal.
 */
export function clipReveal(
  frame: HTMLElement,
  media: HTMLElement | null,
  options: { direction?: ClipDirection; delay?: number; scrollTrigger?: ScrollTrigger.Vars | false } = {},
) {
  const { direction = 'up', delay = 0, scrollTrigger } = options;

  const timeline = gsap.timeline({
    delay,
    defaults: { ease: EASE.drama, duration: DURATION.cinematic },
    scrollTrigger:
      scrollTrigger === false
        ? undefined
        : { trigger: frame, start: 'top 82%', once: true, ...scrollTrigger },
  });

  timeline.fromTo(
    frame,
    { clipPath: CLIP_FROM[direction], willChange: 'clip-path' },
    { clipPath: CLIP_TO, onComplete: () => gsap.set(frame, { clearProps: 'clipPath,willChange' }) },
  );

  if (media) {
    timeline.fromTo(
      media,
      { scale: 1.45, filter: 'blur(12px)' },
      {
        scale: 1,
        filter: 'blur(0px)',
        duration: DURATION.cinematic * 1.1,
        onComplete: () => gsap.set(media, { clearProps: 'filter' }),
      },
      0,
    );
  }

  return timeline;
}

/* -------------------------------------------------------------------------- */
/*  Parallax                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Vertical parallax driven by scrub. `strength` is expressed as a percentage of
 * the element's own height, so it scales with the layout instead of the viewport.
 */
export function parallax(
  element: HTMLElement,
  options: { strength?: number; trigger?: HTMLElement; scrub?: number | boolean } = {},
) {
  const { strength = 14, trigger = element, scrub = true } = options;

  return gsap.fromTo(
    element,
    { yPercent: -strength },
    {
      yPercent: strength,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub,
        invalidateOnRefresh: true,
      },
    },
  );
}

/** Horizontal counterpart, used inside the pinned showcase track. */
export function parallaxX(
  element: HTMLElement,
  options: { strength?: number; containerAnimation?: gsap.core.Tween | gsap.core.Timeline; trigger?: HTMLElement } = {},
) {
  const { strength = 12, containerAnimation, trigger = element } = options;

  return gsap.fromTo(
    element,
    { xPercent: -strength },
    {
      xPercent: strength,
      ease: 'none',
      scrollTrigger: {
        trigger,
        containerAnimation,
        start: 'left right',
        end: 'right left',
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  );
}

/* -------------------------------------------------------------------------- */
/*  Generic entrances                                                         */
/* -------------------------------------------------------------------------- */

export type FadeVariant = 'up' | 'right' | 'left' | 'blur' | 'scale' | 'perspective';

const FADE_FROM: Record<FadeVariant, gsap.TweenVars> = {
  up: { y: 64, autoAlpha: 0 },
  right: { x: 90, autoAlpha: 0 },
  left: { x: -90, autoAlpha: 0 },
  blur: { autoAlpha: 0, filter: 'blur(18px)' },
  scale: { scale: 0.86, autoAlpha: 0 },
  perspective: { rotateX: 38, y: 90, autoAlpha: 0, transformOrigin: '50% 0%' },
};

export function fadeIn(
  targets: gsap.TweenTarget,
  options: {
    variant?: FadeVariant;
    trigger?: HTMLElement;
    stagger?: number;
    delay?: number;
    duration?: number;
    scrollTrigger?: ScrollTrigger.Vars | false;
  } = {},
) {
  const {
    variant = 'up',
    trigger,
    stagger = 0.09,
    delay = 0,
    duration = DURATION.slow,
    scrollTrigger,
  } = options;

  const list = gsap.utils.toArray<HTMLElement>(targets);
  if (!list.length) return null;

  if (variant === 'perspective' && list[0]?.parentElement) {
    gsap.set(list[0].parentElement, { perspective: 1200 });
  }

  return gsap.from(list, {
    ...FADE_FROM[variant],
    duration,
    delay,
    stagger,
    ease: EASE.luxe,
    scrollTrigger:
      scrollTrigger === false
        ? undefined
        : {
            trigger: trigger ?? list[0],
            start: 'top 85%',
            once: true,
            ...scrollTrigger,
          },
    onComplete: () => gsap.set(list, { clearProps: 'filter,transform' }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Section-level atmosphere                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Scales and dims a section as the next one climbs over it.
 *
 * `dimLayer` is an absolutely-positioned solid overlay inside the section. It
 * exists so the dimming can be an opacity tween rather than a scrubbed
 * `filter: brightness()`, which would re-rasterise the entire section on every
 * scroll frame. Callers that pass nothing simply get the scale.
 */
export function departingSection(section: HTMLElement, dimLayer?: HTMLElement | null) {
  const scrollTrigger = {
    trigger: section,
    start: 'bottom 90%',
    end: 'bottom 20%',
    scrub: true,
  } as const;

  const timeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger });

  timeline.to(section, { scale: 0.94 }, 0);
  if (dimLayer) timeline.fromTo(dimLayer, { opacity: 0 }, { opacity: 0.55 }, 0);

  return timeline;
}

/** Hairline that draws itself as the section enters. */
export function drawLine(line: HTMLElement, trigger?: HTMLElement) {
  return gsap.fromTo(
    line,
    { scaleX: 0, transformOrigin: 'left center' },
    {
      scaleX: 1,
      duration: DURATION.cinematic,
      ease: EASE.drama,
      scrollTrigger: { trigger: trigger ?? line, start: 'top 88%', once: true },
    },
  );
}
