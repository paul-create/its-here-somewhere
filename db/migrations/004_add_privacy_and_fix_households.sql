-- Drop old structure, add new
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_key;
ALTER TABLE categories DROP COLUMN IF EXISTS user_id;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_public ON categories(name) WHERE is_private = false;

ALTER TABLE items DROP COLUMN IF EXISTS user_id;
ALTER TABLE items DROP COLUMN IF EXISTS is_private;
ALTER TABLE items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_user_id_name_key;
ALTER TABLE locations DROP COLUMN IF EXISTS user_id;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_name_public ON locations(name) WHERE is_private = false;