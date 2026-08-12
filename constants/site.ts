export const SITE = {
  name: 'Nocturne',
  legalName: 'Nocturne Atelier',
  tagline: 'Objects of desire, rendered in light.',
  description:
    'Nocturne is an independent atelier crafting cinematic digital experiences for the world’s most considered brands. Strategy, design and engineering under one roof.',
  url: 'https://nocturne.atelier',
  locale: 'en_GB',
  founded: 2016,
  email: 'studio@nocturne.atelier',
  phone: '+44 20 7946 0812',
  address: {
    street: '14 Rivington Street',
    city: 'London',
    postcode: 'EC2A 3DU',
    country: 'United Kingdom',
  },
  studios: [
    { city: 'London', timezone: 'Europe/London', coords: '51.5265° N, 0.0784° W' },
    { city: 'Milan', timezone: 'Europe/Rome', coords: '45.4642° N, 9.1900° E' },
    { city: 'Kyoto', timezone: 'Asia/Tokyo', coords: '35.0116° N, 135.7681° E' },
  ],
} as const;

export const SOCIALS = [
  { label: 'Instagram', short: 'IG', href: 'https://instagram.com' },
  { label: 'Behance', short: 'BE', href: 'https://behance.net' },
  { label: 'Dribbble', short: 'DR', href: 'https://dribbble.com' },
  { label: 'LinkedIn', short: 'IN', href: 'https://linkedin.com' },
] as const;
