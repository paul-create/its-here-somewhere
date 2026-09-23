CREATE TABLE IF NOT EXISTS user_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, home_id)
);

CREATE INDEX IF NOT EXISTS idx_user_homes_user_id ON user_homes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_homes_home_id ON user_homes(home_id);

-- Migrate existing user-home relationships to user_homes table
-- This runs only once before schema deployment

-- First, add user_homes table (will be created by objects deploy step)
-- Then migrate data from users.home_id
INSERT INTO user_homes (id, user_id, home_id, joined_at)
SELECT gen_random_uuid(), id, home_id, created_at FROM users WHERE home_id IS NOT NULL
ON CONFLICT (user_id, home_id) DO NOTHING;

-- Finally, remove home_id column from users
ALTER TABLE users DROP COLUMN home_id;
ALTER TABLE users DROP CONSTRAINT users_home_id_email_key;