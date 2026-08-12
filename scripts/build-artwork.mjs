/**
 * Artwork pipeline.
 *
 * Fetches the site's photography, grades it into the NOCTURNE palette, writes
 * the cropped JPEGs into /public/artwork, and regenerates constants/artwork.ts.
 *
 * WHY PHOTOGRAPHY: the previous generator emitted procedural mesh-gradient SVGs.
 * They were cheap and first-party, but every frame on the page was a soft blob
 * of colour — the layout read as a wall of empty tinted cards, which is the one
 * thing a portfolio cannot afford. Real imagery is what gives the grid subject
 * matter. The grade below is what keeps twenty-three unrelated photographs
 * looking like one art-directed set rather than a stock-photo dump.
 *
 * WHY IT IS A BUILD STEP, NOT A RUNTIME CDN: the output is committed to
 * /public, so the site still renders identically offline and never depends on a
 * third-party image host at request time. Re-run only when the selection
 * changes — the network is not touched during `next build`.
 *
 * The sources are Unsplash, whose licence permits free commercial use without
 * attribution; credits are written to public/artwork/CREDITS.md regardless.
 *
 * Run with: npm run gen:art
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/artwork');

/* -------------------------------------------------------------------------- */
/*  Grade                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Palette accents, mirroring styles/globals.css. Each piece is washed with its
 * tone in `soft-light`, which tints the midtones while leaving the blacks black
 * — the reason the whole set shares a temperature without looking filtered.
 */
const TONES = {
  gold: { r: 216, g: 176, b: 106 },
  ember: { r: 196, g: 106, b: 66 },
  jade: { r: 96, g: 176, b: 148 },
  violet: { r: 140, g: 108, b: 208 },
  steel: { r: 116, g: 152, b: 188 },
  rose: { r: 200, g: 122, b: 140 },
  sand: { r: 208, g: 184, b: 142 },
  cyan: { r: 92, g: 176, b: 182 },
};

/** Strength of the tone wash. Low enough that skin and metal stay believable. */
const TONE_ALPHA = 0.22;

/**
 * Shared cinematic grade.
 *
 * Pulled down and desaturated because the page is near-black and every image
 * sits under a gradient scrim: an ungraded photograph punches a bright hole in
 * the composition. The `linear` pass puts the contrast back that the brightness
 * cut removes, so the result is moody rather than merely dim.
 *
 * `exposure` is the per-piece trim on top of that. A uniform grade cannot make
 * a midday sky and a candlelit interior sit in the same wall — the few frames
 * carrying large bright areas need pulling down individually or they read as
 * holes punched in the page. See the `exposure` notes on the pieces below.
 */
async function grade(input, { width, height, tone, focus, exposure = 1 }) {
  const wash = {
    create: {
      width,
      height,
      channels: 4,
      background: { ...TONES[tone], alpha: TONE_ALPHA },
    },
  };

  return sharp(input)
    .resize(width, height, {
      fit: 'cover',
      position: focus === 'attention' ? sharp.strategy.attention : focus,
    })
    .modulate({ saturation: 0.84, brightness: 0.9 * exposure })
    .linear(1.08, -12)
    .composite([{ input: wash, blend: 'soft-light' }])
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();
}

/**
 * A 20px-wide WebP of the finished image, inlined as a data URI.
 *
 * This is what replaces the blank frame while a photograph streams in: the
 * card shows a blurred version of its own artwork from first paint instead of
 * an empty box, so nothing on the page is ever visibly "missing".
 */
async function placeholder(buffer) {
  const lqip = await sharp(buffer).resize(20).webp({ quality: 42 }).toBuffer();
  return `data:image/webp;base64,${lqip.toString('base64')}`;
}

/* -------------------------------------------------------------------------- */
/*  Selection                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every slot on the page, in narrative order.
 *
 * `photo` is an Unsplash photo id. `tone` selects the wash and is kept in step
 * with the copy — the archive plate captioned "Jade Ritual" really is graded
 * jade. `focus` chooses the crop anchor: `attention` finds the salient region,
 * which is what portrait crops of landscape originals need, while `centre`
 * is used where a subject is already centred and smart-cropping would drift.
 */
const PIECES = [
  {
    key: 'heroPrimary',
    name: 'hero-primary',
    photo: '1599643478518-a784e5dc4c8f',
    width: 1400,
    height: 1750,
    tone: 'gold',
    focus: 'centre',
    alt: 'A fine gold chain suspended against darkness, catching a single warm highlight',
  },
  {
    key: 'heroSecondary',
    name: 'hero-secondary',
    photo: '1617038220319-276d3cfab638',
    width: 900,
    height: 1200,
    tone: 'ember',
    focus: 'attention',
    alt: 'A gold ring resting on dark folded silk under raking light',
  },
  {
    key: 'story01',
    name: 'story-01',
    photo: '1558769132-cb1aea458c5e',
    width: 1200,
    height: 1500,
    tone: 'sand',
    focus: 'centre',
    exposure: 0.8,
    alt: 'Dried grasses and undyed cloth in still, diffused daylight',
  },
  {
    key: 'story02',
    name: 'story-02',
    photo: '1518005020951-eccb494ad742',
    width: 1200,
    height: 1500,
    tone: 'steel',
    focus: 'attention',
    // Open sky across the top third; needs the heaviest trim in the set.
    exposure: 0.7,
    alt: 'The curved facade of a building reduced to structure and repetition',
  },
  {
    key: 'story03',
    name: 'story-03',
    photo: '1541701494587-cb58502866ab',
    width: 1200,
    height: 1500,
    tone: 'violet',
    focus: 'attention',
    alt: 'Pigment blooming through water, caught mid-movement',
  },
  {
    key: 'card01',
    name: 'card-01',
    photo: '1594035910387-fea47794261f',
    width: 1200,
    height: 900,
    tone: 'ember',
    focus: 'attention',
    alt: 'A black fragrance bottle staged on deep red petals',
  },
  {
    key: 'card02',
    name: 'card-02',
    photo: '1434056886845-dac89ffe9b56',
    width: 1200,
    height: 900,
    tone: 'steel',
    focus: 'centre',
    alt: 'Macro detail of a black watch dial, machined and precise',
  },
  {
    key: 'card03',
    name: 'card-03',
    photo: '1533139502658-0198f920d8e8',
    width: 1200,
    height: 900,
    tone: 'sand',
    focus: 'attention',
    alt: 'A wristwatch on stone against a low sun and open water',
  },
  {
    key: 'card04',
    name: 'card-04',
    photo: '1481253127861-534498168948',
    width: 1200,
    height: 900,
    tone: 'cyan',
    focus: 'attention',
    exposure: 0.72,
    alt: 'An engineered facade of glass and steel seen from below',
  },
  {
    key: 'showcase01',
    name: 'showcase-01',
    photo: '1573408301185-9146fe634ad0',
    width: 1100,
    height: 1400,
    tone: 'gold',
    focus: 'attention',
    alt: 'A jewelled chain laid across black, each stone lit individually',
  },
  {
    key: 'showcase02',
    name: 'showcase-02',
    photo: '1615634260167-c8cdede054de',
    width: 1100,
    height: 1400,
    tone: 'violet',
    focus: 'attention',
    alt: 'Cut-glass fragrance flacons holding amber light',
  },
  {
    key: 'showcase03',
    name: 'showcase-03',
    photo: '1571896349842-33c89424de2d',
    width: 1100,
    height: 1400,
    tone: 'jade',
    focus: 'attention',
    exposure: 0.9,
    alt: 'A terrace and still water at dusk, lit from within',
  },
  {
    key: 'showcase04',
    name: 'showcase-04',
    photo: '1445205170230-053b83016050',
    width: 1100,
    height: 1400,
    tone: 'rose',
    focus: 'attention',
    alt: 'Garments hung in sequence, warm light falling along the rail',
  },
  {
    key: 'showcase05',
    name: 'showcase-05',
    photo: '1622434641406-a158123450f9',
    width: 1100,
    height: 1400,
    tone: 'steel',
    focus: 'attention',
    alt: 'A mechanical wristwatch photographed in near darkness',
  },
  {
    key: 'gallery01',
    name: 'gallery-01',
    photo: '1602173574767-37ac01994b2a',
    width: 1000,
    height: 1300,
    tone: 'gold',
    focus: 'attention',
    alt: 'Archive plate — a gold bracelet in low warm light',
  },
  {
    key: 'gallery02',
    name: 'gallery-02',
    photo: '1534796636912-3b95b3ab5986',
    width: 1000,
    height: 1000,
    tone: 'cyan',
    focus: 'centre',
    alt: 'Archive plate — a cold field of stars',
  },
  {
    key: 'gallery03',
    name: 'gallery-03',
    photo: '1592945403244-b3fbafd7f539',
    width: 1000,
    height: 1400,
    tone: 'rose',
    focus: 'attention',
    exposure: 0.84,
    alt: 'Archive plate — a flacon among pale roses',
  },
  {
    key: 'gallery04',
    name: 'gallery-04',
    photo: '1508739773434-c26b3d09e071',
    width: 1000,
    height: 1000,
    tone: 'sand',
    focus: 'centre',
    exposure: 0.85,
    alt: 'Archive plate — a ridgeline reduced to bands of shadow',
  },
  {
    key: 'gallery05',
    name: 'gallery-05',
    photo: '1505322022379-7c3353ee6291',
    width: 1000,
    height: 1200,
    tone: 'violet',
    focus: 'centre',
    alt: 'Archive plate — the night sky above a dark horizon',
  },
  {
    key: 'gallery06',
    name: 'gallery-06',
    photo: '1582719478250-c89cae4dc85b',
    width: 1000,
    height: 750,
    tone: 'ember',
    focus: 'attention',
    exposure: 0.85,
    alt: 'Archive plate — a dark timber interior held in warm lamplight',
  },
  {
    key: 'gallery07',
    name: 'gallery-07',
    photo: '1495312040802-a929cd14a6ab',
    width: 1000,
    height: 1250,
    tone: 'jade',
    focus: 'centre',
    exposure: 0.74,
    alt: 'Archive plate — receding hills in green mist',
  },
  {
    key: 'gallery08',
    name: 'gallery-08',
    photo: '1524805444758-089113d48a6d',
    width: 1000,
    height: 1000,
    tone: 'steel',
    focus: 'attention',
    alt: 'Archive plate — a steel watch case, quiet and unadorned',
  },
  {
    key: 'contact',
    name: 'contact',
    photo: '1600585154340-be6161a56a0c',
    width: 2400,
    height: 1500,
    tone: 'gold',
    focus: 'attention',
    // Full-bleed behind the closing headline, so it is graded to sit further
    // back than anything else on the page — it is a ground, not a subject.
    exposure: 0.62,
    // Decorative: the section renders it aria-hidden behind the closing type.
    alt: '',
  },
];

/* -------------------------------------------------------------------------- */
/*  Build                                                                     */
/* -------------------------------------------------------------------------- */

/** Ask Unsplash for enough pixels to cover the crop at 2x without upscaling. */
function sourceUrl(photo, width) {
  return `https://images.unsplash.com/photo-${photo}?w=${Math.min(width * 2, 3000)}&q=88&fm=jpg&fit=max`;
}

async function fetchPhoto(photo, width) {
  const response = await fetch(sourceUrl(photo, width));
  if (!response.ok) throw new Error(`photo-${photo} → HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

mkdirSync(OUT_DIR, { recursive: true });

const built = [];

// Sequential on purpose: twenty-three concurrent fetches plus twenty-three
// concurrent sharp pipelines is enough to get rate-limited at one end and
// thrash memory at the other, and this runs once per selection change.
for (const piece of PIECES) {
  const source = await fetchPhoto(piece.photo, piece.width);
  const jpeg = await grade(source, piece);

  writeFileSync(resolve(OUT_DIR, `${piece.name}.jpg`), jpeg);

  built.push({ ...piece, blurDataURL: await placeholder(jpeg), bytes: jpeg.length });
  console.log(`  ${piece.name}.jpg  ${(jpeg.length / 1024).toFixed(0)}kB`);
}

/* -------------------------------------------------------------------------- */
/*  Emit the manifest                                                         */
/* -------------------------------------------------------------------------- */

const entries = built
  .map(
    (piece) => `  ${piece.key}: {
    src: '/artwork/${piece.name}.jpg',
    width: ${piece.width},
    height: ${piece.height},
    alt: ${JSON.stringify(piece.alt)},
    blurDataURL:
      '${piece.blurDataURL}',
  },`,
  )
  .join('\n');

writeFileSync(
  resolve(ROOT, 'constants/artwork.ts'),
  `/**
 * GENERATED FILE — do not edit by hand.
 * Written by scripts/build-artwork.mjs; run \`npm run gen:art\` to rebuild.
 *
 * Each entry carries its intrinsic size (so every frame reserves its box and
 * the page cannot shift as photography arrives) and a 20px inline placeholder
 * used as next/image's blur-up source.
 */
export type Artwork = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Inline 20px WebP, used as next/image's \`blurDataURL\`. */
  blurDataURL: string;
};

export const ARTWORK = {
${entries}
} satisfies Record<string, Artwork>;
`,
  'utf8',
);

/* A tileable grain sheet used by the global noise overlay. */
writeFileSync(
  resolve(ROOT, 'public/noise.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
<rect width="220" height="220" filter="url(#n)" opacity="0.55"/>
</svg>`,
  'utf8',
);

writeFileSync(
  resolve(OUT_DIR, 'CREDITS.md'),
  `# Artwork credits

Photography sourced from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license), which permits free commercial
use. Each file is cropped and colour-graded by \`scripts/build-artwork.mjs\`.

| File | Source |
| --- | --- |
${built.map((p) => `| \`${p.name}.jpg\` | https://unsplash.com/photos/${p.photo} |`).join('\n')}
`,
  'utf8',
);

const total = built.reduce((sum, piece) => sum + piece.bytes, 0);
console.log(
  `\nBuilt ${built.length} pieces → public/artwork (${(total / 1024 / 1024).toFixed(2)} MB)\n` +
    `Rewrote constants/artwork.ts`,
);
