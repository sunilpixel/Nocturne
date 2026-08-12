'use client';

import type { ReactNode } from 'react';

import { CursorProvider } from '@/components/providers/CursorProvider';
import { LoaderProvider } from '@/components/providers/LoaderProvider';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

/**
 * Provider composition, ordered by dependency:
 *   Loader        — owns the reveal handshake
 *   SmoothScroll  — locked and released by the loader, so it must sit inside it
 *   Cursor        — leaf-most; nothing else depends on it
 *
 * `children` is passed through as a prop, so provider state changes re-render
 * only the provider itself and never the page beneath it.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LoaderProvider>
      <SmoothScrollProvider>
        <CursorProvider>{children}</CursorProvider>
      </SmoothScrollProvider>
    </LoaderProvider>
  );
}
