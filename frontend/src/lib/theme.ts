export const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'text-status-gathering', bg: 'bg-status-gathering-bg' },
  active: { label: 'Active', color: 'text-status-brewing', bg: 'bg-status-brewing-bg' },
  complete: { label: 'Complete', color: 'text-status-bottled', bg: 'bg-status-bottled-bg' },
  archived: { label: 'Archived', color: 'text-status-spilled', bg: 'bg-status-spilled-bg' },
} as const;

export const NAV_ITEMS = [
  { path: '/', label: 'Home', glyph: '\u2302' },
  { path: '/formulas', label: 'Formulas', glyph: '\u25C9' },
  { path: '/techniques', label: 'Techniques', glyph: '\u2726' },
  { path: '/projects', label: 'Projects', glyph: '\u25A6' },
  { path: '/materials', label: 'Materials', glyph: '\u25C8' },
  { path: '/curiosities', label: 'Curiosities', glyph: '\u2605' },
] as const;
