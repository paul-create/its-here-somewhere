CREATE TABLE IF NOT EXISTS user_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, home_id)
);

CREATE INDEX IF NOT EXISTS idx_user_homes_user_id ON user_homes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_homes_home_id ON user_homes(home_id);