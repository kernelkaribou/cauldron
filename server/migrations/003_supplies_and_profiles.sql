-- Migration 003: Rename materials → supplies + custom attribute profiles
-- This migration renames tables/columns and adds the supply profiles system.

-- Step 1: Create supply_profiles table (must exist before FK reference)
CREATE TABLE supply_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  schema TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(schema) AND json_type(schema) = 'array'),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, owner_id)
);
CREATE INDEX idx_supply_profiles_owner ON supply_profiles(owner_id);

-- Step 2: Rename main tables
ALTER TABLE materials RENAME TO supplies;
ALTER TABLE material_vendors RENAME TO supply_vendors;
ALTER TABLE material_stock RENAME TO supply_stock;
ALTER TABLE craft_materials RENAME TO craft_supplies;
ALTER TABLE project_materials RENAME TO project_supplies;

-- Step 3: Rename FK columns
ALTER TABLE supply_vendors RENAME COLUMN material_id TO supply_id;
ALTER TABLE supply_stock RENAME COLUMN material_id TO supply_id;
ALTER TABLE craft_supplies RENAME COLUMN material_id TO supply_id;
ALTER TABLE project_supplies RENAME COLUMN material_id TO supply_id;

-- Step 4: Add new columns to supplies
ALTER TABLE supplies ADD COLUMN material TEXT;
ALTER TABLE supplies ADD COLUMN brand TEXT;
ALTER TABLE supplies ADD COLUMN profile_id INTEGER REFERENCES supply_profiles(id) ON DELETE SET NULL;
ALTER TABLE supplies ADD COLUMN attributes TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(attributes) AND json_type(attributes) = 'object');

-- Step 5: Rebuild notes table with updated CHECK constraint
CREATE TABLE notes_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('project','craft','technique','supply','curiosity')),
  entity_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notes_new SELECT id, owner_id,
  CASE WHEN entity_type = 'material' THEN 'supply' ELSE entity_type END,
  entity_id, title, content, created_at, updated_at FROM notes;
DROP TABLE notes;
ALTER TABLE notes_new RENAME TO notes;
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

-- Step 6: Rebuild photos table with updated CHECK constraint
CREATE TABLE photos_new (
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
INSERT INTO photos_new SELECT id, owner_id,
  CASE WHEN entity_type = 'material' THEN 'supply' ELSE entity_type END,
  entity_id, image, caption, sort_order, is_cover, created_at FROM photos;
DROP TABLE photos;
ALTER TABLE photos_new RENAME TO photos;
CREATE INDEX idx_photos_entity ON photos(entity_type, entity_id);

-- Step 7: Rebuild entity_tags table with updated CHECK constraint
CREATE TABLE entity_tags_new (
  entity_type TEXT NOT NULL CHECK(entity_type IN ('craft','technique','project','supply','curiosity')),
  entity_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_type, entity_id, tag_id)
);
INSERT INTO entity_tags_new SELECT
  CASE WHEN entity_type = 'material' THEN 'supply' ELSE entity_type END,
  entity_id, tag_id FROM entity_tags;
DROP TABLE entity_tags;
ALTER TABLE entity_tags_new RENAME TO entity_tags;
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);

-- Step 8: Add indexes for new columns
CREATE INDEX idx_supplies_profile ON supplies(profile_id);
CREATE INDEX idx_supplies_material ON supplies(material);
CREATE INDEX idx_supplies_brand ON supplies(brand);
