CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(photo_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_tags_photo_id ON tags(photo_id);