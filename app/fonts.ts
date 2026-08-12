import { Inter, Instrument_Serif } from 'next/font/google';

/**
 * Two families, one job each: a grotesque carrying the entire interface, and a
 * serif italic used only for accent words. Both are self-hosted by next/font
 * with `display: swap`, so there is no render-blocking request and no FOIT.
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
});

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument',
  weight: '400',
  style: ['normal', 'italic'],
});

export const fontVariables = `${inter.variable} ${instrumentSerif.variable}`;
