'use client';

import { useEffect, useRef } from 'react';

import { EASE, gsap } from '@/animations/core';
import { splitText } from '@/animations/text';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { NAV_ITEMS } from '@/constants/navigation';
import { SITE, SOCIALS } from '@/constants/site';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { prefersReducedMotion } from '@/lib/utils';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  activeSection: string;
};

/**
 * Full-screen menu.
 *
 * The panel stays mounted so its timeline can be built once and simply
 * reversed — rebuilding a SplitType on every open would thrash the DOM. It is
 * hidden from assistive tech and removed from the tab order while closed.
 */
export function MobileMenu({ open, onClose, onNavigate, activeSection }: MobileMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const { stop, start } = useSmoothScroll();

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const panel = root.querySelector<HTMLElement>('[data-menu-panel]');
      const links = gsap.utils.toArray<HTMLElement>('[data-menu-link]', root);
      const meta = gsap.utils.toArray<HTMLElement>('[data-menu-meta]', root);
      if (!panel) return;

      const reverts: Array<() => void> = [];
      const linkTargets = links.map((link) => {
        const { targets, revert } = splitText(link, 'words-up');
        reverts.push(revert);
        return targets;
      });

      const timeline = gsap
        .timeline({ paused: true, defaults: { ease: EASE.drama } })
        .set(root, { pointerEvents: 'auto' })
        .fromTo(
          panel,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 },
          0,
        )
        .from(
          linkTargets.flat(),
          { yPercent: 120, autoAlpha: 0, duration: 0.8, stagger: 0.04, ease: EASE.luxe },
          0.25,
        )
        .from(meta, { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.06 }, 0.5);

      timelineRef.current = timeline;

      return () => {
        reverts.forEach((revert) => revert());
        timeline.kill();
        timelineRef.current = null;
      };
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const timeline = timelineRef.current;
    const root = rootRef.current;

    if (prefersReducedMotion()) {
      if (root) {
        root.style.opacity = open ? '1' : '0';
        root.style.pointerEvents = open ? 'auto' : 'none';
      }
      return;
    }

    if (!timeline) return;

    if (open) {
      stop();
      timeline.timeScale(1).play();
    } else {
      timeline.timeScale(1.6).reverse();
      timeline.eventCallback('onReverseComplete', () => {
        if (root) root.style.pointerEvents = 'none';
      });
      start();
    }
  }, [open, stop, start]);

  // Escape closes; focus is returned by the toggle button that owns state.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      id="mobile-menu"
      inert={!open}
      aria-hidden={!open}
      className="pointer-events-none fixed inset-0 z-[110] lg:hidden"
    >
      <div
        data-menu-panel
        className="absolute inset-0 flex flex-col justify-between bg-ink px-[var(--spacing-gutter)] pb-12 pt-32"
        style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(48rem circle at 80% 10%, rgba(216,176,106,0.14), transparent 60%)',
          }}
        />

        <nav aria-label="Mobile" className="relative flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.id);
              }}
              aria-current={activeSection === item.id ? 'true' : undefined}
              className="group flex items-baseline gap-4 border-b border-hairline/60 py-4"
            >
              <span className="font-mono text-[0.6rem] text-gold">{item.index}</span>
              <span
                data-menu-link
                className="text-heading font-medium uppercase tracking-[-0.02em] text-bone transition-colors duration-500 group-hover:text-gold-soft"
              >
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="relative flex flex-col gap-8">
          <a
            data-menu-meta
            href={`mailto:${SITE.email}`}
            className="text-lede text-bone underline decoration-gold/40 underline-offset-8"
          >
            {SITE.email}
          </a>

          <ul data-menu-meta className="flex flex-wrap gap-x-6 gap-y-2">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="eyebrow transition-colors duration-500 hover:text-gold"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>

          <p data-menu-meta className="eyebrow">
            {SITE.address.city} — {SITE.address.postcode}
          </p>
        </div>
      </div>
    </div>
  );
}
