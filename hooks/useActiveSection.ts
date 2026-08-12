'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which section currently owns the viewport.
 *
 * Uses a band across the middle of the screen as the observation window so the
 * indicator flips at the point a human would say the section "is on screen",
 * not the instant one pixel of it appears.
 */
export function useActiveSection(ids: readonly string[], fallback = ids[0] ?? '') {
  const [active, setActive] = useState(fallback);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const visibility = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId = '';
        let bestRatio = 0;
        visibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId && bestRatio > 0) setActive(bestId);
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
