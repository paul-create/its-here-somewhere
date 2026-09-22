CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_home_id ON items(home_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_created_by ON items(created_by);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_home_created ON items(home_id, created_at DESC, id DESC);