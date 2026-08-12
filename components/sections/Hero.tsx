'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { gsap } from '@/animations/core';
import {
  attachHeroDeparture,
  attachHeroFloat,
  attachHeroParallax,
  attachSpotlight,
  buildHeroIntro,
  type HeroElements,
} from '@/animations/hero';
import { useCursorTarget } from '@/components/providers/CursorProvider';
import { useLoader } from '@/components/providers/LoaderProvider';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { AmbientLights } from '@/components/ui/AmbientLights';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ParticleField } from '@/components/ui/ParticleField';
import { ARTWORK } from '@/constants/artwork';
import { HERO } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

/**
 * Hero.
 *
 * Six independent motion systems share one gsap.context: the entrance (cued by
 * the preloader), an endless plate float, scroll-linked background parallax, a
 * scroll-linked departure, a pointer spotlight, and the ambient light field.
 * All of them tear down together.
 */
export function Hero() {
  const { hasRevealed } = useLoader();
  const { scrollTo } = useSmoothScroll();

  const contentRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const plateCursor = useCursorTarget('view', 'Work');

  const sectionRef = useGsapScope<HTMLElement>(
    (section) => {
      const plates = gsap.utils.toArray<HTMLElement>('[data-hero-plate]', section);
      const layers = gsap.utils.toArray<HTMLElement>('[data-hero-layer]', section);

      if (prefersReducedMotion()) {
        gsap.set('[data-hero-reveal]', { autoAlpha: 1, clearProps: 'all' });
        return;
      }

      const elements: HeroElements = {
        eyebrow: section.querySelector('[data-hero-eyebrow]'),
        headline: section.querySelector('[data-hero-headline]'),
        lede: section.querySelector('[data-hero-lede]'),
        actions: gsap.utils.toArray<HTMLElement>('[data-hero-action]', section),
        meta: gsap.utils.toArray<HTMLElement>('[data-hero-meta]', section),
        plates,
        scrollCue: section.querySelector('[data-hero-cue]'),
      };

      // Scroll-linked systems can be built immediately — they are position
      // driven, not time driven, so they cost nothing until the page moves.
      attachHeroParallax(section, layers);
      if (contentRef.current) attachHeroDeparture(section, contentRef.current, plates);

      const detachSpotlight = spotlightRef.current
        ? attachSpotlight(section, spotlightRef.current)
        : undefined;

      if (!hasRevealed) {
        // Hold the composition off-screen until the curtain starts lifting.
        gsap.set(
          [elements.headline, elements.lede, elements.eyebrow, ...elements.actions, ...elements.meta].filter(
            Boolean,
          ) as HTMLElement[],
          { autoAlpha: 0 },
        );
        gsap.set(plates, { clipPath: 'inset(100% 0% 0% 0%)' });
        return detachSpotlight;
      }

      const intro = buildHeroIntro(elements);
      // The idle float only begins once the plates have finished arriving.
      intro.timeline.eventCallback('onComplete', () => attachHeroFloat(plates));

      return () => {
        detachSpotlight?.();
        intro.timeline.kill();
        intro.revert();
      };
    },
    [hasRevealed],
  );

  const [lineOne, lineTwo, lineThree] = HERO.headline;

  return (
    <section
      ref={sectionRef}
      id="hero"
      // On desktop the hero is exactly one viewport tall, never taller: the
      // composition is meant to be read in a single frame, and the scroll cue
      // in the rail below is a lie if the rail is already off-screen. `svh`
      // rather than `dvh` for the same reason the rest of the page uses it —
      // dvh reflows the whole section while mobile browser chrome collapses.
      className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden pb-10 pt-32 md:pt-40 lg:h-[100svh] lg:pb-6 lg:pt-28"
    >
      {/* ---- Background stack ------------------------------------------- */}
      <div
        data-hero-layer
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(120%_90%_at_50%_0%,#0d0b09_0%,#050506_55%,#030304_100%)]"
      />
      <AmbientLights className="-z-20" />
      <ParticleField className="-z-10" count={54} />

      <div
        data-hero-layer
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-20 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent"
      />

      {/* Pointer spotlight */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
        // No blur filter: this element tracks the pointer every frame, so a
        // blur would re-rasterise a 600px surface on each move. The gradient's
        // own falloff supplies the softness.
        style={{
          background: 'radial-gradient(circle, rgba(216,176,106,0.20), transparent 68%)',
        }}
      />

      {/* ---- Content ----------------------------------------------------- */}
      <div ref={contentRef} className="container-luxe relative z-10 flex flex-1 flex-col justify-center">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-10">
          {/* `@container`: the headline below is sized in `cqw`, against this
              cell rather than the viewport. See the note on the h1. */}
          <div className="@container lg:col-span-8">
            <div className="overflow-hidden">
              <p data-hero-eyebrow className="eyebrow">
                {HERO.eyebrow}
              </p>
            </div>

            {/* Deliberately NOT `text-mega`.
                That token is `clamp(3.25rem, 13vw, 15rem)` — sized against the
                viewport, which is correct for the closing statement in Contact
                because that headline gets the full container. Here the headline
                occupies eight of twelve columns, a cell that stops growing at
                roughly 900px while 13vw keeps climbing. At 1440px it resolved
                to 187px, where the longest line ("desire, rendered") needs
                about 1620px, so the copy broke mid-word and pushed the hero
                641px past the fold — on the LCP view, at the commonest laptop
                size. Sizing in `cqw` ties the type to the space it actually has
                so the three authored lines hold at every width. */}
            <h1
              data-hero-headline
              data-hero-reveal
              className="mt-8 text-[clamp(2.5rem,10.5cqw,6rem)] font-medium uppercase leading-[0.82] tracking-[-0.045em] text-bone opacity-0"
            >
              <span className="block">{lineOne}</span>
              <span className="block">{lineTwo}</span>
              <span className="block">
                {/* The accent word carries the serif italic — one deviation from
                    the grotesque, used exactly once, is what makes it register. */}
                <span data-accent className="font-serif italic lowercase tracking-[-0.01em] text-gradient">
                  {lineThree.split(' ')[0]}
                </span>{' '}
                {lineThree.split(' ').slice(1).join(' ')}
              </span>
            </h1>

            <p
              data-hero-lede
              data-hero-reveal
              className="mt-10 max-w-[44ch] text-lede text-mist opacity-0 lg:mt-8"
            >
              {HERO.lede}
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-4 lg:mt-10">
              <div data-hero-action>
                <MagneticButton
                  href={HERO.primaryCta.href}
                  variant="solid"
                  size="lg"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollTo(HERO.primaryCta.href);
                  }}
                >
                  {HERO.primaryCta.label}
                </MagneticButton>
              </div>

              <div data-hero-action>
                <MagneticButton
                  href={HERO.secondaryCta.href}
                  variant="outline"
                  size="lg"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollTo(HERO.secondaryCta.href);
                  }}
                >
                  {HERO.secondaryCta.label}
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Floating plates */}
          {/* The plate column is the tallest thing in the grid, so it — not the
              copy — is what used to set the hero's height, at a flat 38rem
              regardless of the window. Capping it against the viewport is what
              keeps the whole section inside one screen on a short laptop. */}
          <div className="relative h-[26rem] sm:h-[32rem] lg:col-span-4 lg:h-[min(38rem,50svh)]">
            <figure
              data-hero-plate
              className="group absolute right-0 top-0 h-[74%] w-[68%] overflow-hidden rounded-[1.5rem] rim reflect will-change-transform"
              {...plateCursor}
            >
              <Image
                src={ARTWORK.heroPrimary.src}
                alt={ARTWORK.heroPrimary.alt}
                fill
                priority
                // The LCP element: fetchPriority lifts it above the rest of the
                // hero's work so the largest paint is not queued behind them.
                fetchPriority="high"
                sizes="(max-width: 1024px) 60vw, 26vw"
                placeholder="blur"
                blurDataURL={ARTWORK.heroPrimary.blurDataURL}
                className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/60 to-transparent" />
            </figure>

            <figure
              data-hero-plate
              className="group absolute bottom-0 left-0 h-[52%] w-[54%] overflow-hidden rounded-[1.25rem] rim reflect will-change-transform"
              {...plateCursor}
            >
              <Image
                src={ARTWORK.heroSecondary.src}
                alt={ARTWORK.heroSecondary.alt}
                fill
                priority
                sizes="(max-width: 1024px) 48vw, 20vw"
                placeholder="blur"
                blurDataURL={ARTWORK.heroSecondary.blurDataURL}
                className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/60 to-transparent" />
            </figure>

            {/* A slowly rotating ring — the only purely decorative element here. */}
            <div
              aria-hidden="true"
              className="animate-drift absolute left-[38%] top-[42%] h-24 w-24 rounded-full border border-gold/25"
            />
          </div>
        </div>
      </div>

      {/* ---- Footer rail -------------------------------------------------- */}
      <div className="container-luxe relative z-10 mt-16 flex flex-wrap items-end justify-between gap-8 border-t border-hairline/60 pt-8 lg:mt-10">
        <dl className="flex flex-wrap gap-x-12 gap-y-4">
          {HERO.meta.map((item) => (
            <div data-hero-meta key={item.label} className="flex flex-col gap-1">
              <dt className="eyebrow">{item.label}</dt>
              <dd className="font-mono text-2xl font-light text-bone">{item.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          data-hero-cue
          onClick={() => scrollTo('#ethos')}
          className={cn(
            'group flex items-center gap-4 text-left',
            'transition-colors duration-500 hover:text-gold',
          )}
          aria-label="Scroll to the next section"
        >
          <span className="relative flex h-12 w-7 items-start justify-center rounded-full border border-hairline p-1.5">
            {/* The dot falls, resets, falls again — a scroll hint that reads
                instantly without needing a label. */}
            <span className="h-1.5 w-1.5 animate-[drift_2.2s_ease-in-out_infinite] rounded-full bg-gold" />
          </span>
          <span className="eyebrow transition-colors duration-500 group-hover:text-gold">
            Scroll to explore
          </span>
        </button>
      </div>
    </section>
  );
}
