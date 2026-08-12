import { gsap, ScrollTrigger } from '@/animations/core';

type MarqueeOptions = {
  /** 1 = leftward, -1 = rightward. */
  direction?: 1 | -1;
  /** Pixels travelled per second. */
  speed?: number;
  /** Scroll velocity nudges the loop's timeScale for a sense of inertia. */
  reactToScroll?: boolean;
};

/** Below this delta the smoothing has visually converged and can stop. */
const EPSILON = 0.002;

/**
 * Infinite marquee.
 *
 * The track holds exactly two identical runs of the content, so translating it
 * by -50% lands on a pixel-identical frame and the seam is mathematically
 * invisible. Duration is derived from measured width, which keeps every row on
 * the same px/second regardless of how much copy it contains.
 *
 * timeScale is smoothed by hand rather than by a tween. The scroll-reactive
 * version of this previously called `gsap.to(tween, { timeScale })` from
 * ScrollTrigger's onUpdate — one tween constructed, overwrite-resolved and
 * garbage-collected per scroll frame, per marquee row, for the entire length
 * of the page. It is now a single ticker callback that lerps toward a target
 * and unregisters itself once it has converged, so a marquee nobody is
 * scrolling past costs literally nothing.
 */
export function createMarquee(track: HTMLElement, options: MarqueeOptions = {}) {
  const { direction = 1, speed = 60, reactToScroll = true } = options;

  const distance = track.scrollWidth / 2;
  if (distance <= 0) return { kill: () => {}, pause: () => {}, resume: () => {} };

  const duration = distance / speed;

  const tween = gsap.fromTo(
    track,
    { xPercent: direction === 1 ? 0 : -50 },
    {
      xPercent: direction === 1 ? -50 : 0,
      duration,
      ease: 'none',
      repeat: -1,
    },
  );

  /** Resting speed: 1 while running, 0 while hover-paused. */
  let rest = 1;
  /** Scroll-velocity contribution on top of `rest`, decays on its own. */
  let boost = 0;
  let current = 1;
  let ticking = false;

  const tick = () => {
    boost += -boost * 0.08;
    const target = rest === 0 ? 0 : rest + boost;
    current += (target - current) * 0.15;
    tween.timeScale(current);

    // Converged and at rest — nothing left to smooth, so stop burning a frame
    // callback until something asks for a change again.
    if (Math.abs(current - target) < EPSILON && Math.abs(boost) < EPSILON) {
      current = target;
      tween.timeScale(current);
      stopTicking();
    }
  };

  function startTicking() {
    if (ticking) return;
    ticking = true;
    gsap.ticker.add(tick);
  }

  function stopTicking() {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
  }

  let scrollTrigger: ScrollTrigger | null = null;

  if (reactToScroll) {
    scrollTrigger = ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        // Map scroll velocity onto timeScale, clamped so it never looks manic.
        boost = Math.abs(gsap.utils.clamp(-2.6, 2.6, self.getVelocity() / 900));
        startTicking();
      },
      // Pause offscreen rows: an invisible marquee should cost nothing.
      onToggle: (self) => {
        if (self.isActive) {
          tween.play();
        } else {
          tween.pause();
          stopTicking();
        }
      },
    });
  }

  return {
    pause: () => {
      rest = 0;
      startTicking();
    },
    resume: () => {
      rest = 1;
      startTicking();
    },
    kill: () => {
      stopTicking();
      scrollTrigger?.kill();
      tween.kill();
    },
  };
}
