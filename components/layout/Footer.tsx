"use client";

import { EASE, gsap } from "@/animations/core";
import { fadeIn } from "@/animations/reveals";
import { attachCharHover } from "@/animations/text";
import { useCursorTarget } from "@/components/providers/CursorProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Marquee } from "@/components/ui/Marquee";
import { Monogram } from "@/components/ui/Monogram";
import { CLOSING_MARQUEE, FOOTER_LINKS } from "@/constants/content";
import { SITE, SOCIALS } from "@/constants/site";
import { useGsapScope } from "@/hooks/useGsapScope";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Footer.
 *
 * The wordmark runs a per-character hover wave (SplitType, reverted on
 * unmount), social links roll their labels, and the whole block lifts into
 * place on entry. The back-to-top control routes through Lenis so the return
 * journey is eased rather than instant.
 */
export function Footer() {
  const { scrollTo } = useSmoothScroll();
  const linkCursor = useCursorTarget("link");
  const currentYear = new Date().getFullYear();

  const footerRef = useGsapScope<HTMLElement>((footer) => {
    if (prefersReducedMotion()) return;

    fadeIn(footer.querySelectorAll("[data-footer-item]"), {
      variant: "up",
      trigger: footer,
      stagger: 0.08,
    });

    // Slow drifting glow behind the wordmark.
    const glow = footer.querySelector<HTMLElement>("[data-footer-glow]");
    if (glow) {
      gsap.to(glow, {
        xPercent: 12,
        yPercent: -8,
        scale: 1.12,
        duration: 14,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    const wordmark = footer.querySelector<HTMLElement>(
      "[data-footer-wordmark]",
    );
    return wordmark ? attachCharHover(wordmark) : undefined;
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden border-t border-hairline bg-ink pt-20 lg:pt-28"
    >
      <div
        data-footer-glow
        aria-hidden="true"
        // Blur-free: an endless drift tween scales this 52rem surface, and a
        // filter would make the GPU re-blur it on every one of those frames.
        className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,176,106,0.14),transparent_70%)]"
      />

      {/* Closing marquee */}
      <div className="relative border-b border-hairline/60 pb-10">
        <Marquee
          items={CLOSING_MARQUEE}
          direction={-1}
          speed={48}
          separator={<span className="mx-6" />}
          itemClassName="text-[clamp(1.6rem,4vw,3rem)] font-medium uppercase tracking-[-0.02em] text-mist"
        />
      </div>

      <div className="container-luxe relative pt-20">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* ---- Address block ------------------------------------------- */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div data-footer-item className="flex items-center gap-3">
              <Monogram className="h-8 w-8 text-gold" />
              <span className="text-sm uppercase tracking-[0.32em] text-bone">
                {SITE.name}
              </span>
            </div>

            <AnimatedText
              as="p"
              variant="lines-up"
              className="max-w-[24ch] text-heading font-medium text-bone"
            >
              {SITE.tagline}
            </AnimatedText>

            <address
              data-footer-item
              className="flex flex-col gap-1 not-italic text-sm text-mist"
            >
              <span>{SITE.address.street}</span>
              <span>
                {SITE.address.city} {SITE.address.postcode}
              </span>
              <span>{SITE.address.country}</span>
            </address>

            <div data-footer-item className="flex flex-col gap-2">
              <a
                href={`mailto:${SITE.email}`}
                className="group w-fit text-lede text-bone"
                {...linkCursor}
              >
                {SITE.email}
                <span className="mt-1 block h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
              </a>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="w-fit text-sm text-mist transition-colors duration-500 hover:text-gold"
                {...linkCursor}
              >
                {SITE.phone}
              </a>
            </div>
          </div>

          {/* ---- Link columns -------------------------------------------- */}
          {FOOTER_LINKS.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              data-footer-item
              className="flex flex-col gap-6 lg:col-span-2"
            >
              <h2 className="eyebrow">{column.title}</h2>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => {
                  const isExternal = link.href.startsWith("http");

                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...(isExternal
                          ? { target: "_blank", rel: "noreferrer noopener" }
                          : {
                              onClick: (event: React.MouseEvent) => {
                                event.preventDefault();
                                scrollTo(link.href);
                              },
                            })}
                        className="group relative inline-flex items-center gap-2 overflow-hidden text-sm text-mist"
                        {...linkCursor}
                      >
                        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                          {link.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-full block text-gold-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full"
                        >
                          {link.label}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}

          {/* ---- Back to top --------------------------------------------- */}
          <div
            data-footer-item
            className="flex flex-col items-start gap-6 lg:col-span-3 lg:items-end"
          >
            <MagneticButton
              variant="outline"
              size="md"
              onClick={() => scrollTo(0)}
              ariaLabel="Scroll back to top"
            >
              Back to top
            </MagneticButton>

            <ul className="flex flex-wrap gap-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-hairline transition-colors duration-500 hover:border-gold/60"
                    {...linkCursor}
                  >
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-8">
                      {social.short}
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute translate-y-8 text-[0.62rem] uppercase tracking-[0.16em] text-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    >
                      {social.short}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- Wordmark ---------------------------------------------------- */}
        {/* The type scale lives on the wrapper so the padding below can be
            expressed in `em` and track the clamp. That padding is headroom for
            the hover lift: the box still clips horizontally, but letters now
            have somewhere to rise into instead of being cut off at the cap. */}
        <div className="relative mt-24 overflow-hidden py-[0.16em] text-[clamp(3.5rem,17vw,15rem)]">
          <span
            data-footer-wordmark
            className="block select-none text-center font-medium uppercase leading-[0.8] tracking-[-0.05em] text-bone/90"
          >
            {SITE.name}
          </span>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-hairline py-8">
          <p className="eyebrow">
            © {currentYear} {SITE.legalName}
          </p>
          <p className="eyebrow">All rights reserved</p>
          <p className="eyebrow">
            {SITE.address.city} · {SITE.studios[1].city} ·{" "}
            {SITE.studios[2].city}
          </p>
        </div>
      </div>
    </footer>
  );
}
