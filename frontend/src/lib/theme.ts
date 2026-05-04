export const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'text-status-gathering', bg: 'bg-status-gathering-bg' },
  active: { label: 'Active', color: 'text-status-brewing', bg: 'bg-status-brewing-bg' },
  complete: { label: 'Complete', color: 'text-status-bottled', bg: 'bg-status-bottled-bg' },
  archived: { label: 'Archived', color: 'text-status-spilled', bg: 'bg-status-spilled-bg' },
} as const;

export const NAV_ITEMS = [
  { path: '/', label: 'Home', glyph: '⌂' },
  { path: '/crafts', label: 'Crafts', glyph: '◉' },
  { path: '/techniques', label: 'Techniques', glyph: '✦' },
  { path: '/projects', label: 'Projects', glyph: '▦' },
  { path: '/materials', label: 'Materials', glyph: '◈' },
  { path: '/curiosities', label: 'Curiosities', glyph: '★' },
] as const;
