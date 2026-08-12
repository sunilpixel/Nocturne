import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

/** Remap a value from one numeric range to another, clamped to the output. */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return clamp(outMin + t * (outMax - outMin), Math.min(outMin, outMax), Math.max(outMin, outMax));
};

/** Zero-padded index, e.g. 3 -> "03". Used across every section's numbering. */
export const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export const isBrowser = typeof window !== 'undefined';

export const prefersReducedMotion = () =>
  isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Coarse pointer => no hover affordances, no custom cursor, lighter timelines. */
export const isTouchDevice = () =>
  isBrowser && window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** Split a string into words for staggered per-word markup. */
export const toWords = (value: string) => value.trim().split(/\s+/);
