'use client';

import { useCallback, useRef, useState } from 'react';

import { EASE, gsap, ScrollTrigger } from '@/animations/core';
import { useCursorTarget } from '@/components/providers/CursorProvider';
import { useLoader } from '@/components/providers/LoaderProvider';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Monogram } from '@/components/ui/Monogram';
import { NAV_ITEMS } from '@/constants/navigation';
import { SITE } from '@/constants/site';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

export function Navbar() {
  const { hasRevealed } = useLoader();
  const { scrollTo } = useSmoothScroll();
  const activeSection = useActiveSection(SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const logoMarkRef = useRef<SVGSVGElement>(null);
  const linkCursor = useCursorTarget('link');

  const navigate = useCallback(
    (id: string) => {
      setMenuOpen(false);
      // Offset by the bar's own height so the section title isn't clipped.
      scrollTo(`#${id}`, { offset: -12 });
    },
    [scrollTo],
  );

  const rootRef = useGsapScope<HTMLElement>(
    (root) => {
      if (prefersReducedMotion()) {
        gsap.set(root, { autoAlpha: 1, y: 0 });
        return;
      }

      // Entrance is cued by the preloader, not by mount.
      gsap.set(root, { autoAlpha: 0, y: -28 });

      if (hasRevealed) {
        gsap.to(root, { autoAlpha: 1, y: 0, duration: 1.2, delay: 0.35, ease: EASE.luxe });
      }

      // Glass + border only once the page has actually moved.
      //
      // The condensed state is a data attribute driving a CSS transition, not
      // a GSAP tween. `backdrop-filter` was previously interpolated as a
      // string every frame of a 0.6s tween on a full-width fixed bar; now it
      // is switched once, and the browser transitions the cheap properties.
      const bar = barRef.current;
      if (!bar) return;

      const trigger = ScrollTrigger.create({
        start: 'top -80',
        end: 99999,
        onToggle: (self) => {
          bar.dataset.condensed = self.isActive ? 'true' : 'false';
        },
      });

      return () => trigger.kill();
    },
    [hasRevealed],
  );

  const handleLogoEnter = () => {
    if (prefersReducedMotion()) return;
    gsap.to(logoMarkRef.current, { rotate: 180, scale: 1.1, duration: 0.9, ease: EASE.drama });
  };

  const handleLogoLeave = () => {
    if (prefersReducedMotion()) return;
    gsap.to(logoMarkRef.current, { rotate: 0, scale: 1, duration: 0.9, ease: EASE.drama });
  };

  return (
    <>
      <header ref={rootRef} className="fixed inset-x-0 top-0 z-[120]">
        <div ref={barRef} data-navbar-bar data-condensed="false">
          <nav
            aria-label="Primary"
            className="container-luxe flex items-center justify-between gap-8"
          >
            {/* Logo */}
            <a
              href="#hero"
              onClick={(event) => {
                event.preventDefault();
                navigate('hero');
              }}
              className="group flex items-center gap-3"
              aria-label={`${SITE.name} — back to top`}
              {...linkCursor}
              // Composed after the spread so the cursor morph and the mark
              // rotation both run, rather than one silently replacing the other.
              onPointerEnter={() => {
                linkCursor.onPointerEnter();
                handleLogoEnter();
              }}
              onPointerLeave={() => {
                linkCursor.onPointerLeave();
                handleLogoLeave();
              }}
            >
              <Monogram ref={logoMarkRef} className="h-7 w-7 text-gold" />
              <span className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-medium uppercase tracking-[0.32em] text-bone transition-[letter-spacing] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:tracking-[0.42em]">
                  {SITE.name}
                </span>
                <span className="mt-1 text-[0.5rem] uppercase tracking-[0.3em] text-fog">
                  Atelier
                </span>
              </span>
            </a>

            {/* Desktop links */}
            <ul className="hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(item.id);
                      }}
                      aria-current={isActive ? 'true' : undefined}
                      className="group relative flex items-center gap-2 px-4 py-2"
                      {...linkCursor}
                    >
                      <span
                        className={cn(
                          'font-mono text-[0.55rem] transition-colors duration-500',
                          isActive ? 'text-gold' : 'text-fog',
                        )}
                      >
                        {item.index}
                      </span>

                      <span className="relative overflow-hidden">
                        {/* Two stacked labels — a clean roll on hover. */}
                        <span
                          className={cn(
                            'block text-[0.72rem] uppercase tracking-[0.16em] transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full',
                            isActive ? 'text-bone' : 'text-mist',
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-full block text-[0.72rem] uppercase tracking-[0.16em] text-gold-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full"
                        >
                          {item.label}
                        </span>

                        {/* Underline: grows from the left on hover, pinned when active. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute inset-x-0 bottom-0 h-px origin-left bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                          )}
                        />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-3">
              <MagneticButton
                href="#contact"
                variant="outline"
                size="sm"
                className="hidden md:inline-flex"
                onClick={(event) => {
                  event.preventDefault();
                  navigate('contact');
                }}
              >
                Start a project
              </MagneticButton>

              {/* Menu toggle */}
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-hairline transition-colors duration-500 hover:border-gold/60 lg:hidden"
                {...linkCursor}
              >
                <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute h-px w-4 bg-bone transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    menuOpen ? 'translate-y-0 rotate-45' : '-translate-y-1',
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute h-px w-4 bg-bone transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    menuOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1',
                  )}
                />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
        activeSection={activeSection}
      />
    </>
  );
}
