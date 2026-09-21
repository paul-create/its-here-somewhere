CREATE TABLE IF NOT EXISTS _deleted.photos_deleted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  item_id UUID NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  uploaded_by UUID NOT NULL,
  deleted_by UUID NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_photos_deleted_home_id ON _deleted.photos_deleted(home_id);
CREATE INDEX IF NOT EXISTS idx_photos_deleted_deleted_at ON _deleted.photos_deleted(deleted_at);