CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  item_id UUID REFERENCES items(id),
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  property VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_home_id ON activity_log(home_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_item_id ON activity_log(item_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_changed_at ON activity_log(changed_at);