/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Optimisation is ON, unlike under the previous artwork set.
    //
    // That set was procedurally generated SVG, and the optimiser cannot
    // resample vector art — it passed the bytes through unchanged, so routing
    // 23 images via /_next/image bought nothing and cost a hop each. The
    // artwork is now photography, which inverts the trade completely: AVIF
    // lands these frames at roughly a fifth of the JPEG bytes, and the
    // per-breakpoint widths below mean a phone fetches a phone-sized crop
    // instead of the 2400px master.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560],
    // Card and plate media never render full-bleed; these are the widths the
    // `sizes` attributes on the archive and showcase grids actually resolve to.
    imageSizes: [180, 256, 384, 512, 768],
    // The sources in /public are content-addressed by the build script and
    // only change when the selection does, so a long optimiser cache is safe.
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['gsap', 'split-type'],
  },
};

export default nextConfig;
