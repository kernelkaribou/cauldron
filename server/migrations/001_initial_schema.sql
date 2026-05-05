-- Cauldron initial schema

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  avatar TEXT,
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
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

CREATE TABLE techniques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  difficulty TEXT CHECK(difficulty IN ('beginner','intermediate','advanced')),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE technique_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  technique_id INTEGER NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('video','article','other'))
);

CREATE TABLE supply_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  schema TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(schema) AND json_type(schema) = 'array'),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, owner_id)
);

CREATE TABLE supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  unit TEXT,
  reusable INTEGER DEFAULT 0,
  price REAL DEFAULT 0,
  profile_id INTEGER REFERENCES supply_profiles(id) ON DELETE SET NULL,
  attributes TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(attributes) AND json_type(attributes) = 'object'),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supply_vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  thumbnail TEXT,
  duration_minutes INTEGER DEFAULT 0,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE craft_techniques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  craft_id INTEGER NOT NULL REFERENCES crafts(id) ON DELETE CASCADE,
  technique_id INTEGER NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(craft_id, technique_id)
);

CREATE TABLE craft_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  craft_id INTEGER NOT NULL REFERENCES crafts(id) ON DELETE CASCADE,
  supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  quantity REAL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  UNIQUE(craft_id, supply_id)
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','active','complete','paused')),
  due_date TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_crafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  craft_id INTEGER NOT NULL REFERENCES crafts(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(project_id, craft_id)
);

CREATE TABLE project_techniques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technique_id INTEGER NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(project_id, technique_id)
);

CREATE TABLE project_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  quantity REAL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  UNIQUE(project_id, supply_id)
);

CREATE TABLE supply_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('purchase','usage','adjustment')),
  quantity REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  location TEXT,
  notes TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
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
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  thumbnail TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, url)
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('project','craft','technique','supply','curiosity')),
  entity_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('project','craft','technique','supply','curiosity','log')),
  entity_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  craft_id INTEGER REFERENCES crafts(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  links TEXT DEFAULT '[]',
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  done INTEGER DEFAULT 0,
  due_date TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_tags (
  entity_type TEXT NOT NULL CHECK(entity_type IN ('craft','technique','project','supply','curiosity')),
  entity_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_type, entity_id, tag_id)
);

-- Indexes
CREATE INDEX idx_supply_profiles_owner ON supply_profiles(owner_id);
CREATE INDEX idx_supplies_owner ON supplies(owner_id);
CREATE INDEX idx_supplies_profile ON supplies(profile_id);
CREATE INDEX idx_supplies_brand ON supplies(brand);
CREATE INDEX idx_supply_vendors_supply ON supply_vendors(supply_id);
CREATE INDEX idx_supply_stock_supply ON supply_stock(supply_id);
CREATE INDEX idx_techniques_owner ON techniques(owner_id);
CREATE INDEX idx_techniques_category ON techniques(category_id);
CREATE INDEX idx_crafts_owner ON crafts(owner_id);
CREATE INDEX idx_crafts_category ON crafts(category_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_crafts_project ON project_crafts(project_id);
CREATE INDEX idx_project_crafts_craft ON project_crafts(craft_id);
CREATE INDEX idx_curiosities_owner ON curiosities(owner_id);
CREATE INDEX idx_curiosities_category ON curiosities(category_id);
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_photos_entity ON photos(entity_type, entity_id);
CREATE INDEX idx_logs_craft ON logs(craft_id);
CREATE INDEX idx_logs_project ON logs(project_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
