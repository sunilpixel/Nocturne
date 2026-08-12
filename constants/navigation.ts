export type NavItem = {
  id: string;
  label: string;
  index: string;
};

/**
 * `id` doubles as the DOM id of the corresponding <section>, which is what the
 * active-section indicator observes. Keep in sync with app/page.tsx.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'hero', label: 'Index', index: '01' },
  { id: 'ethos', label: 'Ethos', index: '02' },
  { id: 'craft', label: 'Craft', index: '03' },
  { id: 'work', label: 'Work', index: '04' },
  { id: 'archive', label: 'Archive', index: '05' },
  { id: 'contact', label: 'Contact', index: '06' },
] as const;
