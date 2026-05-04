-- Cauldron initial schema

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  avatar TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, owner_id)
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, owner_id)
);

CREATE TABLE spells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  craft_id INTEGER REFERENCES crafts(id) ON DELETE SET NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spell_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spell_id INTEGER NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('video','article','other'))
);

CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  craft_id INTEGER REFERENCES crafts(id) ON DELETE SET NULL,
  thumbnail TEXT,
  duration_minutes INTEGER DEFAULT 0,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_spells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  spell_id INTEGER NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(recipe_id, spell_id)
);

CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity REAL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  UNIQUE(recipe_id, ingredient_id)
);

CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  reusable INTEGER DEFAULT 0,
  preferred_links TEXT DEFAULT '[]',
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'gathering' CHECK(status IN ('gathering','brewing','bottled','spilled')),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brew_spells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
  spell_id INTEGER NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(brew_id, spell_id)
);

CREATE TABLE brew_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity REAL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  UNIQUE(brew_id, ingredient_id)
);

CREATE TABLE ingredient_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('purchase','usage','adjustment')),
  quantity REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  location TEXT,
  notes TEXT,
  brew_id INTEGER REFERENCES brews(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE curiosities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('link','video','image','article')),
  craft_id INTEGER REFERENCES crafts(id) ON DELETE SET NULL,
  thumbnail TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, url)
);

CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  done INTEGER DEFAULT 0,
  due_date TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  brew_id INTEGER REFERENCES brews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tag junction tables
CREATE TABLE recipe_tags (
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE TABLE spell_tags (
  spell_id INTEGER NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (spell_id, tag_id)
);

CREATE TABLE brew_tags (
  brew_id INTEGER NOT NULL REFERENCES brews(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (brew_id, tag_id)
);

CREATE TABLE ingredient_tags (
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ingredient_id, tag_id)
);

CREATE TABLE curiosity_tags (
  curiosity_id INTEGER NOT NULL REFERENCES curiosities(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (curiosity_id, tag_id)
);

-- Indexes for common queries
CREATE INDEX idx_spells_owner ON spells(owner_id);
CREATE INDEX idx_spells_craft ON spells(craft_id);
CREATE INDEX idx_recipes_owner ON recipes(owner_id);
CREATE INDEX idx_recipes_craft ON recipes(craft_id);
CREATE INDEX idx_brews_owner ON brews(owner_id);
CREATE INDEX idx_brews_status ON brews(status);
CREATE INDEX idx_brews_recipe ON brews(recipe_id);
CREATE INDEX idx_ingredients_owner ON ingredients(owner_id);
CREATE INDEX idx_curiosities_owner ON curiosities(owner_id);
CREATE INDEX idx_curiosities_craft ON curiosities(craft_id);
CREATE INDEX idx_ingredient_stock_ingredient ON ingredient_stock(ingredient_id);
CREATE INDEX idx_photos_recipe ON photos(recipe_id);
CREATE INDEX idx_photos_brew ON photos(brew_id);
CREATE INDEX idx_logs_recipe ON logs(recipe_id);
CREATE INDEX idx_logs_brew ON logs(brew_id);
CREATE INDEX idx_tasks_recipe ON tasks(recipe_id);
CREATE INDEX idx_tasks_brew ON tasks(brew_id);
CREATE INDEX idx_journal_recipe ON journal_entries(recipe_id);
CREATE INDEX idx_journal_brew ON journal_entries(brew_id);
