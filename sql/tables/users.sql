CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  email VARCHAR(255) NOT NULL,
  cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(home_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_home_id ON users(home_id);
CREATE INDEX IF NOT EXISTS idx_users_cognito_user_id ON users(cognito_user_id);