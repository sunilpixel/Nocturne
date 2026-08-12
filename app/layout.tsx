import type { Metadata, Viewport } from 'next';

import { fontVariables } from '@/app/fonts';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Preloader } from '@/components/layout/Preloader';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { AppProviders } from '@/components/providers/AppProviders';
import { Cursor } from '@/components/ui/Cursor';
import { NoiseOverlay, VignetteOverlay } from '@/components/ui/NoiseOverlay';
import { ARTWORK } from '@/constants/artwork';
import { SITE } from '@/constants/site';

import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.legalName,
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  keywords: [
    'creative studio',
    'digital atelier',
    'luxury web design',
    'art direction',
    'interaction design',
    'motion design',
    'GSAP',
  ],
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    // Social cards must be raster — every major crawler refuses SVG, so the
    // previous /artwork/hero-primary.svg reference rendered no preview at all.
    images: [
      {
        url: ARTWORK.contact.src,
        width: ARTWORK.contact.width,
        height: ARTWORK.contact.height,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [ARTWORK.contact.src],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
  category: 'design',
};

export const viewport: Viewport = {
  themeColor: '#030304',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** Organisation schema — one JSON-LD block, no client cost. */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.legalName,
  url: SITE.url,
  email: SITE.email,
  telephone: SITE.phone,
  foundingDate: String(SITE.founded),
  description: SITE.description,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    postalCode: SITE.address.postcode,
    addressCountry: SITE.address.country,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Marks the document as JS-capable before first paint. The pre-split
            opacity:0 rule is scoped to this flag, so text stays visible if
            JavaScript never arrives. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.js="true";document.documentElement.dataset.loading="true"`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="relative bg-void text-bone antialiased">
        {/* Skip link — the first thing keyboard users reach. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[400] focus:rounded-full focus:bg-bone focus:px-6 focus:py-3 focus:text-sm focus:text-void"
        >
          Skip to content
        </a>

        <AppProviders>
          <Preloader />
          <Cursor />
          <NoiseOverlay />
          <VignetteOverlay />
          <ScrollProgress />
          <Navbar />

          <main id="main">{children}</main>

          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
