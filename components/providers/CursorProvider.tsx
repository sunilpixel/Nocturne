'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type CursorVariant =
  | 'default'
  | 'link'
  | 'view'
  | 'drag'
  | 'text'
  | 'plate'
  | 'hidden';

export type CursorState = {
  variant: CursorVariant;
  label: string;
  /** Optional artwork shown inside the cursor (archive plate previews). */
  preview: string | null;
};

const INITIAL: CursorState = { variant: 'default', label: '', preview: null };

type CursorApi = {
  set: (next: Partial<CursorState> & { variant: CursorVariant }) => void;
  reset: () => void;
};

const CursorStateContext = createContext<CursorState>(INITIAL);
const CursorApiContext = createContext<CursorApi | null>(null);

/**
 * State and API are separate contexts on purpose: the API object is referentially
 * stable, so the hundreds of interactive elements that only need `set`/`reset`
 * never re-render when the cursor changes shape. Only <Cursor /> subscribes to
 * the state half.
 */
export function CursorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CursorState>(INITIAL);

  const set = useCallback<CursorApi['set']>((next) => {
    setState({ label: '', preview: null, ...next });
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  const api = useMemo<CursorApi>(() => ({ set, reset }), [set, reset]);

  return (
    <CursorApiContext.Provider value={api}>
      <CursorStateContext.Provider value={state}>{children}</CursorStateContext.Provider>
    </CursorApiContext.Provider>
  );
}

export function useCursorState() {
  return useContext(CursorStateContext);
}

export function useCursor(): CursorApi {
  const context = useContext(CursorApiContext);
  if (!context) {
    throw new Error('useCursor must be used inside <CursorProvider>');
  }
  return context;
}

/**
 * Spreadable pointer handlers that morph the cursor for a given element.
 * Keeps every call site to one prop instead of two hand-written listeners.
 */
export function useCursorTarget(variant: CursorVariant, label = '', preview: string | null = null) {
  const cursor = useCursor();

  return useMemo(
    () => ({
      onPointerEnter: () => cursor.set({ variant, label, preview }),
      onPointerLeave: () => cursor.reset(),
    }),
    [cursor, variant, label, preview],
  );
}
