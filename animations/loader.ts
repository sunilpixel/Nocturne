import { EASE, gsap } from '@/animations/core';
import { splitText } from '@/animations/text';

export type LoaderElements = {
  root: HTMLElement;
  columns: HTMLElement[];
  mark: SVGPathElement | null;
  markWrap: HTMLElement | null;
  title: HTMLElement | null;
  tagline: HTMLElement | null;
  counter: HTMLElement | null;
  bar: HTMLElement | null;
  meta: HTMLElement[];
};

/**
 * Act one: the loader assembles itself while assets stream in.
 *
 * The percentage is intentionally *not* wired to real byte progress — browsers
 * expose that too coarsely to look good. It runs on a curve to 95 and is then
 * released to 100 by the real `load` event, which reads as honest without
 * stuttering.
 */
export function buildLoaderIntro(elements: LoaderElements) {
  const { markWrap, mark, title, tagline, counter, bar, meta } = elements;

  const splits = [] as Array<() => void>;
  const timeline = gsap.timeline({ defaults: { ease: EASE.luxe } });

  if (mark) {
    // Self-drawing monogram: measure once, then animate the dash offset.
    const length = mark.getTotalLength();
    gsap.set(mark, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
    timeline.to(mark, { strokeDashoffset: 0, duration: 1.6, ease: EASE.drama }, 0.1);
  }

  if (markWrap) {
    timeline.from(markWrap, { scale: 0.8, autoAlpha: 0, duration: 1.2 }, 0);
  }

  if (title) {
    const { targets, revert } = splitText(title, 'chars-up');
    splits.push(revert);
    timeline
      .set(title, { autoAlpha: 1 }, 0)
      .from(targets, { yPercent: 115, duration: 1.1, stagger: 0.045 }, 0.35);
  }

  if (tagline) {
    const { targets, revert } = splitText(tagline, 'words-up');
    splits.push(revert);
    timeline
      .set(tagline, { autoAlpha: 1 }, 0)
      .from(targets, { yPercent: 120, autoAlpha: 0, duration: 0.9, stagger: 0.05 }, 0.75);
  }

  if (meta.length) {
    timeline.from(meta, { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.1 }, 0.9);
  }

  if (counter) {
    timeline.from(counter, { autoAlpha: 0, y: 30, duration: 0.9 }, 0.5);
  }

  if (bar) {
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
  }

  return {
    timeline,
    revert: () => splits.forEach((fn) => fn()),
  };
}

/**
 * Drives the percentage read-out and the loading bar from one tweened value,
 * so the number and the bar can never disagree.
 */
export function buildProgressTween(
  counter: HTMLElement | null,
  bar: HTMLElement | null,
  options: { to: number; duration: number; from?: number },
) {
  const state = { value: options.from ?? 0 };

  return gsap.to(state, {
    value: options.to,
    duration: options.duration,
    ease: 'power2.inOut',
    snap: { value: 1 },
    onUpdate: () => {
      if (counter) counter.textContent = String(Math.round(state.value)).padStart(3, '0');
      if (bar) gsap.set(bar, { scaleX: state.value / 100 });
    },
  });
}

/**
 * Act two: the curtain. Content leaves upward, then the panels retract in a
 * staggered wipe that hands the frame to the hero mid-motion — `onStart` is
 * where the hero is told to begin, so the two overlap instead of queueing.
 */
export function buildLoaderOutro(
  elements: LoaderElements,
  callbacks: { onReveal: () => void; onComplete: () => void },
) {
  const { root, columns, markWrap, title, tagline, counter, bar, meta } = elements;

  const timeline = gsap.timeline({
    defaults: { ease: EASE.dramaInOut },
    onComplete: callbacks.onComplete,
  });

  const content = [title, tagline, counter, markWrap, ...meta].filter(Boolean) as HTMLElement[];

  if (bar) {
    timeline.to(bar, { scaleX: 1, duration: 0.4, ease: EASE.drama }, 0);
    timeline.to(bar, { transformOrigin: 'right center', scaleX: 0, duration: 0.6 }, 0.4);
  }

  if (content.length) {
    timeline.to(
      content,
      { yPercent: -110, autoAlpha: 0, duration: 0.9, stagger: 0.05, ease: EASE.drama },
      0.25,
    );
  }

  timeline.to(
    columns,
    {
      scaleY: 0,
      transformOrigin: 'top center',
      duration: 1.35,
      stagger: { each: 0.07, from: 'start' },
      onStart: callbacks.onReveal,
    },
    0.75,
  );

  timeline.set(root, { display: 'none' });

  return timeline;
}
