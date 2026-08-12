'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type LoaderContextValue = {
  /** True until the preloader's exit animation has finished. */
  isLoading: boolean;
  /** True the moment the exit begins — this is the cue for hero entrances. */
  hasRevealed: boolean;
  complete: () => void;
  reveal: () => void;
};

const LoaderContext = createContext<LoaderContextValue | null>(null);

/**
 * Two-stage loader state.
 *
 * `reveal` fires as the curtain starts lifting so the hero animates *into* the
 * opening rather than after it — the overlap is what makes the handover feel
 * like one continuous shot instead of two sequential animations.
 */
export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasRevealed, setHasRevealed] = useState(false);

  const reveal = useCallback(() => setHasRevealed(true), []);
  const complete = useCallback(() => setIsLoading(false), []);

  const value = useMemo<LoaderContextValue>(
    () => ({ isLoading, hasRevealed, complete, reveal }),
    [isLoading, hasRevealed, complete, reveal],
  );

  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>;
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used inside <LoaderProvider>');
  }
  return context;
}
