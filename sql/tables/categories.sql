CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_home_name_public 
  ON categories(home_id, name) WHERE is_private = false;
CREATE INDEX IF NOT EXISTS idx_categories_home_id ON categories(home_id);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);