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

CREATE TABLE materials (
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

CREATE TABLE craft_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  craft_id INTEGER NOT NULL REFERENCES crafts(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity REAL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  UNIQUE(craft_id, material_id)
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','active','complete','archived')),
  craft_id INTEGER REFERENCES crafts(id) ON DELETE SET NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_techniques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technique_id INTEGER NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(project_id, technique_id)
);

CREATE TABLE project_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity REAL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  UNIQUE(project_id, material_id)
);

CREATE TABLE material_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
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

CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  craft_id INTEGER REFERENCES crafts(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  craft_id INTEGER REFERENCES crafts(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  craft_id INTEGER REFERENCES crafts(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
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
  craft_id INTEGER REFERENCES crafts(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tag junction tables
CREATE TABLE craft_tags (
  craft_id INTEGER NOT NULL REFERENCES crafts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (craft_id, tag_id)
);

CREATE TABLE technique_tags (
  technique_id INTEGER NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (technique_id, tag_id)
);

CREATE TABLE project_tags (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE material_tags (
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, tag_id)
);

CREATE TABLE curiosity_tags (
  curiosity_id INTEGER NOT NULL REFERENCES curiosities(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (curiosity_id, tag_id)
);

-- Indexes for common queries
CREATE INDEX idx_techniques_owner ON techniques(owner_id);
CREATE INDEX idx_techniques_category ON techniques(category_id);
CREATE INDEX idx_crafts_owner ON crafts(owner_id);
CREATE INDEX idx_crafts_category ON crafts(category_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_craft ON projects(craft_id);
CREATE INDEX idx_materials_owner ON materials(owner_id);
CREATE INDEX idx_curiosities_owner ON curiosities(owner_id);
CREATE INDEX idx_curiosities_category ON curiosities(category_id);
CREATE INDEX idx_material_stock_material ON material_stock(material_id);
CREATE INDEX idx_photos_craft ON photos(craft_id);
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_logs_craft ON logs(craft_id);
CREATE INDEX idx_logs_project ON logs(project_id);
CREATE INDEX idx_tasks_craft ON tasks(craft_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_journal_craft ON journal_entries(craft_id);
CREATE INDEX idx_journal_project ON journal_entries(project_id);
