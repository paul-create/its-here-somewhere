CREATE TABLE IF NOT EXISTS _deleted.items_deleted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  category_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER,
  created_by UUID NOT NULL,
  deleted_by UUID NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_created_at TIMESTAMP,
  original_updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_deleted_home_id ON _deleted.items_deleted(home_id);
CREATE INDEX IF NOT EXISTS idx_items_deleted_deleted_at ON _deleted.items_deleted(deleted_at);