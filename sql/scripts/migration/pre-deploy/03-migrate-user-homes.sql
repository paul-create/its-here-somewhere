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