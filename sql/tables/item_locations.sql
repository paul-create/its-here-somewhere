CREATE TABLE IF NOT EXISTS item_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  item_id UUID NOT NULL REFERENCES items(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  moved_by UUID NOT NULL REFERENCES users(id),
  stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_locations_home_id ON item_locations(home_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_item_id ON item_locations(item_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_location_id ON item_locations(location_id);