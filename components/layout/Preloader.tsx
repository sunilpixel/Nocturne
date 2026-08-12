'use client';

import { useRef } from 'react';

import { gsap, ScrollTrigger } from '@/animations/core';
import { buildLoaderIntro, buildLoaderOutro, buildProgressTween, type LoaderElements } from '@/animations/loader';
import { useLoader } from '@/components/providers/LoaderProvider';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { Monogram } from '@/components/ui/Monogram';
import { useGsapScope } from '@/hooks/useGsapScope';
import { SITE } from '@/constants/site';
import { prefersReducedMotion } from '@/lib/utils';

const COLUMN_COUNT = 6;

/**
 * Hard ceiling — a slow asset must never hold the page hostage.
 *
 * Scroll is locked for this whole window, so it is the largest single
 * contributor to how responsive the site *feels* on a first visit, regardless
 * of how fast everything after it runs.
 */
const MAX_WAIT_MS = 2600;

/**
 * Floor for the assemble sequence, so a warm cache does not cut the opening
 * animation off mid-gesture. The counter still resolves to 100 before the
 * curtain moves; this only guarantees the choreography is legible.
 */
const MIN_INTRO_MS = 1400;

/**
 * The opening sequence.
 *
 * Three phases on one master timeline: assemble (monogram draws, type splits
 * in), count (a single tweened value feeds both the read-out and the bar), and
 * exit (staggered column wipe). The hero is cued from the exit's `onStart`, so
 * the two sequences overlap and the handover reads as one continuous shot.
 */
export function Preloader() {
  const { reveal, complete } = useLoader();
  const { stop, start } = useSmoothScroll();

  const columnsRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const markWrapRef = useRef<HTMLDivElement>(null);

  const rootRef = useGsapScope<HTMLDivElement>((root) => {
    // Reduced motion: no curtain, no counter — hand the page over immediately.
    if (prefersReducedMotion()) {
      root.style.display = 'none';
      reveal();
      complete();
      return;
    }

    stop();

    const elements: LoaderElements = {
      root,
      columns: gsap.utils.toArray<HTMLElement>('[data-loader-column]', root),
      mark: root.querySelector<SVGPathElement>('[data-monogram-path]'),
      markWrap: markWrapRef.current,
      title: titleRef.current,
      tagline: taglineRef.current,
      counter: counterRef.current,
      bar: barRef.current,
      meta: gsap.utils.toArray<HTMLElement>('[data-loader-meta]', root),
    };

    const intro = buildLoaderIntro(elements);

    // Run to 95 on a curve; the real load event releases the last five.
    const approach = buildProgressTween(elements.counter, elements.bar, {
      to: 95,
      duration: MIN_INTRO_MS / 1000,
    });

    let outro: gsap.core.Timeline | null = null;
    let released = false;

    const finish = () => {
      if (released) return;
      released = true;

      approach.kill();

      const settle = buildProgressTween(elements.counter, elements.bar, {
        from: Number(elements.counter?.textContent ?? 0),
        to: 100,
        duration: 0.5,
      });

      settle.eventCallback('onComplete', () => {
        outro = buildLoaderOutro(elements, {
          onReveal: () => {
            reveal();
            start();
          },
          onComplete: () => {
            complete();
            intro.revert();
            // Pinned sections were measured against a locked document.
            ScrollTrigger.refresh();
          },
        });
      });
    };

    const timer = window.setTimeout(finish, MAX_WAIT_MS);

    const onLoad = () => {
      // Never cut the assemble animation short, even on a warm cache.
      const elapsed = intro.timeline.time();
      window.setTimeout(finish, Math.max(0, MIN_INTRO_MS - elapsed * 1000));
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', onLoad);
      approach.kill();
      outro?.kill();
      intro.timeline.kill();
      intro.revert();
      start();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      // aria-hidden + no focusable content: the loader is decoration, and
      // assistive tech should land straight on the page beneath it.
      aria-hidden="true"
      className="fixed inset-0 z-[300] flex flex-col justify-between overflow-hidden"
    >
      {/* Column layer — the curtain that retracts on exit. */}
      <div ref={columnsRef} className="absolute inset-0 flex">
        {Array.from({ length: COLUMN_COUNT }).map((_, index) => (
          <div
            key={index}
            data-loader-column
            className="h-full flex-1 origin-top bg-void will-change-transform"
            style={{
              // A faint per-column gradient stops the wipe reading as flat black.
              backgroundImage:
                index % 2 === 0
                  ? 'linear-gradient(180deg, #07070a 0%, #030304 100%)'
                  : 'linear-gradient(180deg, #030304 0%, #0b0a08 100%)',
            }}
          />
        ))}
      </div>

      {/* Ambient wash behind the loader content. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60rem circle at 50% 55%, rgba(216,176,106,0.10), transparent 62%)',
        }}
      />

      <header className="container-luxe relative z-10 flex items-center justify-between pt-10">
        <span data-loader-meta className="eyebrow">
          {SITE.legalName}
        </span>
        <span data-loader-meta className="eyebrow">
          Est. {SITE.founded}
        </span>
      </header>

      <div className="container-luxe relative z-10 flex flex-1 flex-col items-center justify-center gap-10">
        <div ref={markWrapRef} className="will-change-transform">
          <Monogram className="h-16 w-16 text-gold md:h-20 md:w-20" animated />
        </div>

        {/* A <div>, not a heading: the page's single h1 belongs to the hero. */}
        <div
          ref={titleRef}
          className="text-center text-display font-medium uppercase tracking-[-0.03em] text-bone opacity-0"
        >
          {SITE.name}
        </div>

        <p ref={taglineRef} className="max-w-[34ch] text-center text-lede text-mist opacity-0">
          {SITE.tagline}
        </p>
      </div>

      <footer className="container-luxe relative z-10 flex flex-col gap-6 pb-10">
        <div className="flex items-end justify-between">
          <span data-loader-meta className="eyebrow">
            Loading experience
          </span>
          <span className="flex items-baseline gap-1 font-mono text-[clamp(2.5rem,7vw,5rem)] font-light leading-none text-bone">
            <span ref={counterRef}>000</span>
            <span className="text-[0.3em] text-gold">%</span>
          </span>
        </div>

        <div className="h-px w-full overflow-hidden bg-hairline">
          <div
            ref={barRef}
            className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-gold-soft will-change-transform"
          />
        </div>
      </footer>
    </div>
  );
}
