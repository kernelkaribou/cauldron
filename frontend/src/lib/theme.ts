export const STATUS_CONFIG = {
  gathering: { label: 'Gathering', color: 'text-status-gathering', bg: 'bg-status-gathering-bg' },
  brewing: { label: 'Brewing', color: 'text-status-brewing', bg: 'bg-status-brewing-bg' },
  bottled: { label: 'Bottled', color: 'text-status-bottled', bg: 'bg-status-bottled-bg' },
  spilled: { label: 'Spilled', color: 'text-status-spilled', bg: 'bg-status-spilled-bg' },
} as const;

export const NAV_ITEMS = [
  { path: '/', label: 'Home', glyph: '\u2302' },
  { path: '/recipes', label: 'Recipes', glyph: '\u25C9' },
  { path: '/spells', label: 'Spells', glyph: '\u2726' },
  { path: '/brews', label: 'Brews', glyph: '\u25A6' },
  { path: '/ingredients', label: 'Ingredients', glyph: '\u25C8' },
  { path: '/curiosities', label: 'Curiosities', glyph: '\u2605' },
] as const;
