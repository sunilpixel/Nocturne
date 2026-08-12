'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { BREAKPOINTS, gsap } from '@/animations/core';
import { attachCardContentReveal, buildCardFlow, buildCardStack } from '@/animations/cards';
import { useCursorTarget } from '@/components/providers/CursorProvider';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TiltCard } from '@/components/ui/TiltCard';
import { CRAFT_CARDS, type CraftCard } from '@/constants/content';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn } from '@/lib/utils';

const TONE_GLOW: Record<CraftCard['tone'], string> = {
  ember: 'from-ember/25',
  steel: 'from-[#4d7ea8]/25',
  sand: 'from-gold/25',
  cyan: 'from-[#2f9aa2]/25',
};

/**
 * Craft — the pinned card stack.
 *
 * Desktop pins the deck and scrubs cards over one another; below that they
 * simply flow. Each card is independently tiltable, so the top of the stack is
 * always the one responding to the pointer.
 */
export function Craft() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardCursor = useCursorTarget('link');

  const sectionRef = useGsapScope<HTMLElement>((section) => {
    const media = gsap.matchMedia();

    media.add(
      {
        stacked: `${BREAKPOINTS.desktop} and ${BREAKPOINTS.motionOk}`,
        flowing: `(max-width: 1023px) and ${BREAKPOINTS.motionOk}`,
      },
      (context) => {
        const { stacked } = context.conditions as Record<string, boolean>;
        const cards = gsap.utils.toArray<HTMLElement>('[data-craft-card]', section);
        const stage = stageRef.current;

        // The pin has to exist before the reveals so they can be measured
        // against it rather than against the pre-pin document position.
        if (stacked && stage) {
          buildCardStack({
            pinTarget: stage,
            cards,
            progressBar: section.querySelector('[data-craft-progress]'),
          });
          // Only the resting card reveals on entry; the rest are revealed by
          // the scrubbed stack as they land.
          attachCardContentReveal(cards.slice(0, 1), stage);
        } else {
          attachCardContentReveal(cards);
          buildCardFlow(cards);
        }
      },
    );

    return () => media.revert();
  }, []);

  return (
    <section ref={sectionRef} id="craft" className="relative bg-void py-28 lg:py-40">
      <div className="container-luxe">
        <SectionHeader
          index="03"
          eyebrow="What we do"
          title="Four disciplines, one continuous hand."
          variant="words-right"
          lede="We do not hand a project between departments. The same people who set the direction write the code that ships it."
          className="max-w-4xl"
        />
      </div>

      {/* Stage: pinned on desktop, a plain column elsewhere. */}
      <div
        ref={stageRef}
        className="container-luxe relative mt-16 flex flex-col gap-8 lg:mt-20 lg:h-[100svh] lg:justify-center lg:gap-0"
      >
        {/* Inside the pinned stage — anywhere above it scrolls away before the
            scrub begins, leaving the bar to fill where nobody can see it. */}
        <div className="hidden h-px w-full overflow-hidden bg-hairline lg:mb-12 lg:block">
          <div
            data-craft-progress
            className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-gold-soft"
          />
        </div>

        <div className="relative lg:h-[32rem]">
          {CRAFT_CARDS.map((card, index) => (
            <div
              key={card.id}
              data-craft-card
              className="relative lg:absolute lg:inset-0 lg:will-change-transform"
              {...cardCursor}
            >
              {/* Recede dimmer. Owned by the scrubbed stack timeline, which
                  animates its opacity in place of a `filter: brightness()` on
                  the card — see animations/cards.ts. */}
              <div
                data-card-dim
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[6] rounded-[var(--radius-luxe)] bg-void opacity-0"
              />

              <TiltCard className="h-full">
                <div className="grid h-full grid-cols-1 gap-8 p-8 md:grid-cols-2 md:gap-12 md:p-12 lg:p-14">
                  {/* Copy */}
                  <div className="relative z-[5] flex flex-col justify-between gap-10">
                    <div className="flex items-center justify-between">
                      <span data-card-part className="font-mono text-micro text-gold">
                        {card.index}
                      </span>
                      <span data-card-part className="eyebrow">
                        {String(index + 1)} / {CRAFT_CARDS.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-6">
                      <h3
                        data-card-part
                        className="text-heading font-medium text-bone md:text-title"
                      >
                        {card.title}
                      </h3>
                      <p data-card-part className="max-w-[38ch] text-lede text-mist">
                        {card.summary}
                      </p>
                    </div>

                    <ul data-card-part className="flex flex-wrap gap-2">
                      {card.disciplines.map((discipline) => (
                        <li
                          key={discipline}
                          className="rounded-full border border-hairline px-4 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-mist transition-colors duration-500 hover:border-gold/50 hover:text-gold-soft"
                        >
                          {discipline}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Artwork */}
                  <figure
                    data-card-part
                    className="relative min-h-[14rem] overflow-hidden rounded-[1.25rem] md:min-h-0"
                  >
                    <Image
                      src={card.artwork.src}
                      alt={card.artwork.alt}
                      fill
                      sizes="(max-width: 768px) 88vw, 40vw"
                      placeholder="blur"
                      blurDataURL={card.artwork.blurDataURL}
                      className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.09]"
                    />
                    <div
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute inset-0 bg-gradient-to-tr to-transparent opacity-60 mix-blend-screen',
                        TONE_GLOW[card.tone],
                      )}
                    />
                  </figure>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
