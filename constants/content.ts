import { ARTWORK, type Artwork } from '@/constants/artwork';

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

export const HERO = {
  eyebrow: 'Independent atelier — est. 2016',
  headline: ['Objects of', 'desire, rendered', 'in light.'],
  accentWordIndex: { line: 2, word: 1 } as const,
  lede:
    'We build cinematic digital experiences for maisons, marques and makers who refuse the ordinary.',
  primaryCta: { label: 'Begin a project', href: '#contact' },
  secondaryCta: { label: 'View the work', href: '#work' },
  meta: [
    { label: 'Awards', value: '38' },
    { label: 'Partners', value: '64' },
    { label: 'Since', value: '2016' },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Marquees                                                                  */
/* -------------------------------------------------------------------------- */

export const MARQUEE_ROWS = [
  {
    id: 'disciplines',
    speed: 44,
    direction: 1 as const,
    items: ['Art Direction', 'Interaction', 'Motion', 'Brand Systems', 'Engineering', 'Sound'],
  },
  {
    id: 'clients',
    speed: 58,
    direction: -1 as const,
    items: ['Aurelia', 'Vesper', 'Solstice', 'Étoile', 'Meridian', 'Obsidian', 'Lumière'],
  },
] as const;

export const CLOSING_MARQUEE = ['Let us make something rare', '—', 'Nocturne Atelier', '—'] as const;

/* -------------------------------------------------------------------------- */
/*  Ethos / storytelling — the pinned chapter sequence                        */
/* -------------------------------------------------------------------------- */

export type StoryChapter = {
  id: string;
  index: string;
  title: string;
  accent: string;
  body: string;
  caption: string;
  artwork: Artwork;
};

export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: 'listen',
    index: '01',
    title: 'We begin in',
    accent: 'silence',
    body: 'Before a single pixel, we listen. To the founder, the archive, the material, the room. The brief is never the brief — it is the first draft of a question worth answering properly.',
    caption: 'Phase one — Immersion',
    artwork: ARTWORK.story01,
  },
  {
    id: 'shape',
    index: '02',
    title: 'Then we shape the',
    accent: 'invisible',
    body: 'Structure precedes surface. Grids, rhythm, pacing, weight. We design the silence between the elements first, because that is where luxury actually lives.',
    caption: 'Phase two — Composition',
    artwork: ARTWORK.story02,
  },
  {
    id: 'render',
    index: '03',
    title: 'And render it in',
    accent: 'motion',
    body: 'Every transition is authored by hand, timed to the frame, tuned until it feels inevitable. Nothing eases by accident. The result is an experience people feel before they can explain.',
    caption: 'Phase three — Execution',
    artwork: ARTWORK.story03,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Craft — the stacking luxury cards                                         */
/* -------------------------------------------------------------------------- */

export type CraftCard = {
  id: string;
  index: string;
  title: string;
  summary: string;
  disciplines: readonly string[];
  artwork: Artwork;
  tone: 'ember' | 'steel' | 'sand' | 'cyan';
};

export const CRAFT_CARDS: readonly CraftCard[] = [
  {
    id: 'direction',
    index: '01',
    title: 'Art Direction',
    summary:
      'A visual thesis with a point of view. Type, colour, light and restraint composed into a language only your brand could speak.',
    disciplines: ['Identity', 'Photography', 'Type systems'],
    artwork: ARTWORK.card01,
    tone: 'ember',
  },
  {
    id: 'interaction',
    index: '02',
    title: 'Interaction',
    summary:
      'Interfaces that respond like objects — weighted, physical, obedient. Every hover, drag and scroll tuned to feel machined rather than coded.',
    disciplines: ['Prototyping', 'Micro-interaction', 'Haptic pacing'],
    artwork: ARTWORK.card02,
    tone: 'steel',
  },
  {
    id: 'motion',
    index: '03',
    title: 'Motion',
    summary:
      'Cinematic choreography across the whole journey. Timelines authored frame by frame so the narrative never stutters and never shouts.',
    disciplines: ['Sequencing', 'Scroll narrative', 'Title design'],
    artwork: ARTWORK.card03,
    tone: 'sand',
  },
  {
    id: 'engineering',
    index: '04',
    title: 'Engineering',
    summary:
      'Production-grade builds that hold sixty frames under pressure. Accessible, indexable, and quietly ruthless about performance.',
    disciplines: ['Next.js', 'WebGL', 'Design systems'],
    artwork: ARTWORK.card04,
    tone: 'cyan',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Work — horizontal showcase                                                */
/* -------------------------------------------------------------------------- */

export type Project = {
  id: string;
  index: string;
  name: string;
  category: string;
  year: string;
  description: string;
  artwork: Artwork;
};

export const PROJECTS: readonly Project[] = [
  {
    id: 'aurelia',
    index: '01',
    name: 'Aurelia',
    category: 'Haute Joaillerie',
    year: '2026',
    description:
      'A gemstone configurator rendered in real time, where light behaves the way it does in the atelier.',
    artwork: ARTWORK.showcase01,
  },
  {
    id: 'vesper',
    index: '02',
    name: 'Vesper',
    category: 'Fragrance',
    year: '2025',
    description:
      'An olfactory narrative told through scroll — six notes, six chapters, one continuous take.',
    artwork: ARTWORK.showcase02,
  },
  {
    id: 'solstice',
    index: '03',
    name: 'Solstice',
    category: 'Hospitality',
    year: '2025',
    description:
      'A booking experience for a cliffside retreat that sells the light before it sells the room.',
    artwork: ARTWORK.showcase03,
  },
  {
    id: 'etoile',
    index: '04',
    name: 'Étoile',
    category: 'Couture',
    year: '2024',
    description:
      'A digital runway that keeps pace with the collection — editorial, immersive, unapologetically slow.',
    artwork: ARTWORK.showcase04,
  },
  {
    id: 'meridian',
    index: '05',
    name: 'Meridian',
    category: 'Horology',
    year: '2024',
    description:
      'Complications explained through motion, engineered to load in under a second on a phone.',
    artwork: ARTWORK.showcase05,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Measures — statistics                                                     */
/* -------------------------------------------------------------------------- */

export type Stat = {
  id: string;
  value: number;
  suffix: string;
  label: string;
  detail: string;
  /** 0–1, drives the progress bar fill. */
  progress: number;
};

export const STATS: readonly Stat[] = [
  {
    id: 'awards',
    value: 38,
    suffix: '',
    label: 'International awards',
    detail: 'Awwwards, FWA, CSSDA',
    progress: 0.76,
  },
  {
    id: 'partners',
    value: 64,
    suffix: '',
    label: 'Maisons partnered',
    detail: 'Across 19 countries',
    progress: 0.64,
  },
  {
    id: 'retention',
    value: 96,
    suffix: '%',
    label: 'Client retention',
    detail: 'Rolling five-year average',
    progress: 0.96,
  },
  {
    id: 'years',
    value: 10,
    suffix: '+',
    label: 'Years in practice',
    detail: 'Independent since 2016',
    progress: 0.5,
  },
] as const;

export const PERFORMANCE_RING = {
  value: 60,
  suffix: 'fps',
  label: 'Sustained frame rate',
  detail:
    'Every build ships against a hard performance budget. Sixty frames is a requirement, not a target.',
  progress: 0.98,
} as const;

/* -------------------------------------------------------------------------- */
/*  Archive — masonry gallery                                                 */
/* -------------------------------------------------------------------------- */

export type ArchivePlate = {
  id: string;
  title: string;
  meta: string;
  artwork: Artwork;
  /** Column span hint for the masonry grid. */
  span: 'tall' | 'wide' | 'normal';
};

export const ARCHIVE_PLATES: readonly ArchivePlate[] = [
  { id: 'p1', title: 'Gilded Hours', meta: 'Print — 2026', artwork: ARTWORK.gallery01, span: 'tall' },
  { id: 'p2', title: 'Cold Signal', meta: 'Motion — 2025', artwork: ARTWORK.gallery02, span: 'normal' },
  { id: 'p3', title: 'Rose Meridian', meta: 'Identity — 2025', artwork: ARTWORK.gallery03, span: 'tall' },
  { id: 'p4', title: 'Dune Study', meta: 'Editorial — 2025', artwork: ARTWORK.gallery04, span: 'normal' },
  { id: 'p5', title: 'Violet Hour', meta: 'Campaign — 2024', artwork: ARTWORK.gallery05, span: 'normal' },
  { id: 'p6', title: 'Ember Field', meta: 'Packaging — 2024', artwork: ARTWORK.gallery06, span: 'wide' },
  { id: 'p7', title: 'Jade Ritual', meta: 'Retail — 2024', artwork: ARTWORK.gallery07, span: 'tall' },
  { id: 'p8', title: 'Steel Quiet', meta: 'Product — 2023', artwork: ARTWORK.gallery08, span: 'normal' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Contact                                                                   */
/* -------------------------------------------------------------------------- */

export const CONTACT = {
  eyebrow: 'Commissions open — Q3 2026',
  headline: ['Let us make', 'something rare.'],
  body: 'We take on eight projects a year. If the ambition is real, the conversation should be too.',
  cta: { label: 'studio@nocturne.atelier', href: 'mailto:studio@nocturne.atelier' },
} as const;

export const FOOTER_LINKS = [
  {
    title: 'Studio',
    links: [
      { label: 'Ethos', href: '#ethos' },
      { label: 'Craft', href: '#craft' },
      { label: 'Work', href: '#work' },
      { label: 'Archive', href: '#archive' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Behance', href: 'https://behance.net' },
      { label: 'Dribbble', href: 'https://dribbble.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
    ],
  },
] as const;
