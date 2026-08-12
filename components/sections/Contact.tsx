'use client';

import Image from 'next/image';

import { EASE, gsap } from '@/animations/core';
import { fadeIn, parallax } from '@/animations/reveals';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ARTWORK } from '@/constants/artwork';
import { CONTACT } from '@/constants/content';
import { SITE } from '@/constants/site';
import { useGsapScope } from '@/hooks/useGsapScope';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * Contact — the closing statement.
 *
 * The artwork is pinned behind the type and scaled on scrub, so the whole
 * section appears to push toward the viewer as it arrives: the last piece of
 * choreography before the footer.
 */
export function Contact() {
  const sectionRef = useGsapScope<HTMLElement>((section) => {
    if (prefersReducedMotion()) return;

    const backdrop = section.querySelector<HTMLElement>('[data-contact-backdrop]');
    if (backdrop) {
      parallax(backdrop, { strength: 12, trigger: section });

      const scrub = {
        trigger: section,
        start: 'top bottom',
        end: 'center center',
        scrub: true,
      } as const;

      gsap.fromTo(backdrop, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: scrub });

      // The lift out of shadow is an overlay fading off, not `brightness()` on
      // the image. This runs on scrub across a full-viewport backdrop, and a
      // filter there would re-rasterise the whole layer every scroll frame.
      const shade = section.querySelector<HTMLElement>('[data-contact-shade]');
      if (shade) {
        gsap.fromTo(shade, { opacity: 0.5 }, { opacity: 0, ease: 'none', scrollTrigger: scrub });
      }
    }

    fadeIn(section.querySelectorAll('[data-contact-item]'), {
      variant: 'up',
      trigger: section,
      stagger: 0.1,
      delay: 0.2,
    });

    // Slow gradient sweep across the headline once it has landed.
    const headline = section.querySelector<HTMLElement>('[data-contact-headline]');
    if (headline) {
      gsap.to(headline, {
        backgroundPosition: '-60% 50%',
        duration: 6,
        ease: EASE.inOut,
        repeat: -1,
        yoyo: true,
        scrollTrigger: { trigger: section, start: 'top 70%' },
      });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden py-32"
    >
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div data-contact-backdrop className="absolute inset-0 scale-110 will-change-transform">
          <Image
            src={ARTWORK.contact.src}
            alt=""
            fill
            aria-hidden="true"
            sizes="100vw"
            placeholder="blur"
            blurDataURL={ARTWORK.contact.blurDataURL}
            className="object-cover opacity-60"
          />
        </div>

        {/* Scrubbed dimmer — replaces a `filter: brightness()` on the image. */}
        <div data-contact-shade aria-hidden="true" className="absolute inset-0 bg-void opacity-50" />

        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/70 to-void" />
      </div>

      <div className="container-luxe relative flex flex-col items-center gap-12 text-center">
        <span data-contact-item className="eyebrow">
          {CONTACT.eyebrow}
        </span>

        <AnimatedText
          as="h2"
          variant="lines-mask"
          data-contact-headline
          className="text-gradient max-w-[14ch] text-mega font-medium uppercase"
        >
          {CONTACT.headline.join(' ')}
        </AnimatedText>

        <p data-contact-item className="max-w-[46ch] text-lede text-mist">
          {CONTACT.body}
        </p>

        <div data-contact-item className="mt-4">
          <MagneticButton href={CONTACT.cta.href} variant="solid" size="lg" strength={0.4}>
            {CONTACT.cta.label}
          </MagneticButton>
        </div>

        {/* Studio clocks — a small, specific detail that sells the address. */}
        <ul
          data-contact-item
          className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4"
        >
          {SITE.studios.map((studio) => (
            <li key={studio.city} className="flex flex-col items-center gap-1">
              <span className="text-sm uppercase tracking-[0.22em] text-bone">{studio.city}</span>
              <span className="font-mono text-[0.6rem] text-fog">{studio.coords}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
