export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface Craft {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface Spell {
  id: number;
  title: string;
  content: string | null;
  craft_id: number | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  craft?: Craft | null;
  tags?: Tag[];
}

export interface SpellResource {
  id: number;
  spell_id: number;
  url: string;
  title: string;
  description: string | null;
  type: 'video' | 'article' | 'other' | null;
}

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  craft_id: number | null;
  thumbnail: string | null;
  duration_minutes: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  craft?: Craft | null;
  tags?: Tag[];
}

export interface Brew {
  id: number;
  title: string;
  description: string | null;
  status: 'gathering' | 'brewing' | 'bottled' | 'spilled';
  recipe_id: number | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  recipe?: { id: number; title: string } | null;
  tags?: Tag[];
}

export interface Ingredient {
  id: number;
  name: string;
  description: string | null;
  unit: string | null;
  reusable: number;
  preferred_links: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Curiosity {
  id: number;
  title: string;
  url: string;
  description: string | null;
  type: 'link' | 'video' | 'image' | 'article' | null;
  craft_id: number | null;
  thumbnail: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  craft?: Craft | null;
  tags?: Tag[];
}

export interface Photo {
  id: number;
  owner_id: number;
  recipe_id: number | null;
  brew_id: number | null;
  image: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Log {
  id: number;
  owner_id: number;
  recipe_id: number | null;
  brew_id: number | null;
  content: string | null;
  duration_minutes: number;
  date: string;
  created_at: string;
}

export interface Task {
  id: number;
  owner_id: number;
  recipe_id: number | null;
  brew_id: number | null;
  title: string;
  notes: string | null;
  done: number;
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  owner_id: number;
  recipe_id: number | null;
  brew_id: number | null;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockEntry {
  id: number;
  ingredient_id: number;
  type: 'purchase' | 'usage' | 'adjustment';
  quantity: number;
  unit_cost: number;
  location: string | null;
  notes: string | null;
  brew_id: number | null;
  date: string;
  owner_id: number;
  created_at: string;
}

export interface StockSummary {
  total_purchased: number;
  total_used: number;
  total_adjusted: number;
  on_hand: number;
  total_spent: number;
  avg_unit_cost: number;
}

export interface SearchResult {
  id: number;
  title: string;
  type: 'recipe' | 'spell' | 'brew' | 'ingredient' | 'curiosity';
}
