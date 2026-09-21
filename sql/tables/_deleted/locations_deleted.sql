CREATE TABLE IF NOT EXISTS _deleted.locations_deleted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_location_id UUID,
  created_by UUID NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  deleted_by UUID NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_created_at TIMESTAMP,
  original_updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_deleted_home_id ON _deleted.locations_deleted(home_id);
CREATE INDEX IF NOT EXISTS idx_locations_deleted_deleted_at ON _deleted.locations_deleted(deleted_at);