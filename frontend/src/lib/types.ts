export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface Category {
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

export interface Technique {
  id: number;
  title: string;
  content: string | null;
  category_id: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  cover_photo_id?: number | null;
  category?: Category | null;
  tags?: Tag[];
}

export interface TechniqueResource {
  id: number;
  technique_id: number;
  url: string;
  title: string;
  description: string | null;
  type: 'video' | 'article' | 'other' | null;
}

export interface CraftTechnique {
  technique_id: number;
  title: string;
  content?: string | null;
  sort_order: number;
  notes?: string | null;
}

export interface CraftSupply {
  supply_id: number;
  name: string;
  quantity: number;
  unit?: string | null;
  notes?: string | null;
}

export interface Craft {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  thumbnail: string | null;
  duration_minutes: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  cover_photo_id?: number | null;
  category?: Category | null;
  tags?: Tag[];
  techniques?: CraftTechnique[];
  supplies?: CraftSupply[];
}

export interface ProjectCraft {
  id: number;
  craft_id: number;
  quantity: number;
  sort_order: number;
  title?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  status: 'planning' | 'active' | 'complete' | 'paused';
  due_date: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  cover_photo_id?: number | null;
  crafts?: ProjectCraft[];
  tags?: Tag[];
}

export interface Supply {
  id: number;
  name: string;
  description: string | null;
  unit: string | null;
  reusable: number;
  price: number;
  brand: string | null;
  type_id: number | null;
  attributes: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  cover_photo_id?: number | null;
  tags?: Tag[];
}

export interface SupplyVendor {
  id: number;
  supply_id: number;
  name: string;
  url: string | null;
  notes: string | null;
  owner_id: number;
  created_at: string;
}

export interface Curiosity {
  id: number;
  title: string;
  url: string;
  description: string | null;
  type: 'link' | 'video' | 'image' | 'article' | null;
  category_id: number | null;
  thumbnail: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  cover_photo_id?: number | null;
  category?: Category | null;
  tags?: Tag[];
}

export interface Photo {
  id: number;
  owner_id: number;
  entity_type: 'project' | 'craft' | 'technique' | 'supply' | 'curiosity' | 'log';
  entity_id: number;
  image: string;
  caption: string | null;
  sort_order: number;
  is_cover: number;
  created_at: string;
}

export interface Log {
  id: number;
  owner_id: number;
  craft_id: number | null;
  project_id: number | null;
  content: string | null;
  duration_minutes: number;
  links: string;
  date: string;
  created_at: string;
}

export interface Task {
  id: number;
  owner_id: number;
  project_id: number;
  title: string;
  notes: string | null;
  done: number;
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface Note {
  id: number;
  owner_id: number;
  entity_type: 'project' | 'craft' | 'technique' | 'supply' | 'curiosity';
  entity_id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockEntry {
  id: number;
  supply_id: number;
  type: 'purchase' | 'usage' | 'adjustment';
  quantity: number;
  unit_cost: number;
  location: string | null;
  notes: string | null;
  project_id: number | null;
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
  type: 'craft' | 'technique' | 'project' | 'supply' | 'curiosity';
}

export interface SupplyTypeField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  required?: boolean;
  unit?: string;
  integer?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  show_in_list?: boolean;
}

export interface SupplyType {
  id: number;
  name: string;
  schema: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}
