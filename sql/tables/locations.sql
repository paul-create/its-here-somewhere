CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  name VARCHAR(255) NOT NULL,
  parent_location_id UUID REFERENCES locations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_home_name_public 
  ON locations(home_id, name) WHERE is_private = false;
CREATE INDEX IF NOT EXISTS idx_locations_home_id ON locations(home_id);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON locations(created_by);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_location_id);