-- Migration: Add home_id multi-tenancy to existing tables
-- Date: 2026-09-22
-- Purpose: Migrate from single-tenant to multi-tenant schema
-- Strategy: Create homes table, add home_id to all tables using temp-table rebuild pattern

BEGIN;

-- ============================================================================
-- STEP 1: Create homes table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  home_code VARCHAR(50) UNIQUE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create default home for existing data
-- All existing records will belong to this home
INSERT INTO public.homes (id, name, home_code, created_by, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000001', 'Default Home', 'default-home-one', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Rebuild users table with home_id
-- ============================================================================
CREATE TABLE users_temp AS SELECT * FROM public.users;

DROP TABLE public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT users_home_id_email_key UNIQUE (home_id, email)
);

INSERT INTO public.users (id, home_id, email, password_hash, full_name, avatar_url, created_at, updated_at)
  SELECT id, '00000000-0000-0000-0000-000000000001', email, password_hash, full_name, avatar_url, created_at, updated_at
  FROM users_temp;

DROP TABLE users_temp;

CREATE INDEX idx_users_home_id ON public.users (home_id);

-- ============================================================================
-- STEP 3: Rebuild categories table with home_id
-- ============================================================================
CREATE TABLE categories_temp AS SELECT * FROM public.categories;

DROP TABLE public.categories CASCADE;

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

INSERT INTO public.categories (id, home_id, name, color, icon, created_by, created_at, updated_at)
  SELECT id, '00000000-0000-0000-0000-000000000001', name, color, icon, created_by, created_at, updated_at
  FROM categories_temp;

DROP TABLE categories_temp;

CREATE INDEX idx_categories_home_id ON public.categories (home_id);
CREATE INDEX idx_categories_created_by ON public.categories (created_by);
CREATE INDEX idx_categories_name_public ON public.categories (home_id, name);

-- ============================================================================
-- STEP 4: Rebuild locations table with home_id
-- ============================================================================
CREATE TABLE locations_temp AS SELECT * FROM public.locations;

DROP TABLE public.locations CASCADE;

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_location_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT locations_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT locations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT locations_parent_location_id_fkey FOREIGN KEY (parent_location_id) REFERENCES public.locations(id)
);

INSERT INTO public.locations (id, home_id, name, parent_location_id, created_by, created_at, updated_at)
  SELECT id, '00000000-0000-0000-0000-000000000001', name, parent_location_id, created_by, created_at, updated_at
  FROM locations_temp;

DROP TABLE locations_temp;

CREATE INDEX idx_locations_home_id ON public.locations (home_id);
CREATE INDEX idx_locations_created_by ON public.locations (created_by);
CREATE INDEX idx_locations_name_public ON public.locations (home_id, name);
CREATE INDEX idx_locations_parent_id ON public.locations (parent_location_id);

-- ============================================================================
-- STEP 5: Rebuild items table with home_id
-- ============================================================================
CREATE TABLE items_temp AS SELECT * FROM public.items;

DROP TABLE public.items CASCADE;

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  category_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT items_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

INSERT INTO public.items (id, home_id, category_id, name, description, created_by, created_at, updated_at)
  SELECT id, '00000000-0000-0000-0000-000000000001', category_id, name, description, created_by, created_at, updated_at
  FROM items_temp;

DROP TABLE items_temp;

CREATE INDEX idx_items_home_id ON public.items (home_id);
CREATE INDEX idx_items_category_id ON public.items (category_id);
CREATE INDEX idx_items_created_by ON public.items (created_by);
CREATE INDEX idx_items_created_at ON public.items (created_at);

-- ============================================================================
-- STEP 6: Rebuild item_locations table with home_id
-- ============================================================================
CREATE TABLE item_locations_temp AS SELECT * FROM public.item_locations;

DROP TABLE public.item_locations CASCADE;

CREATE TABLE public.item_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  item_id UUID NOT NULL,
  location_id UUID NOT NULL,
  moved_by UUID NOT NULL,
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_current BOOLEAN DEFAULT TRUE,
  CONSTRAINT item_locations_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT item_locations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT item_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT item_locations_moved_by_fkey FOREIGN KEY (moved_by) REFERENCES public.users(id)
);

INSERT INTO public.item_locations (id, home_id, item_id, location_id, moved_by, moved_at, is_current)
  SELECT id, '00000000-0000-0000-0000-000000000001', item_id, location_id, moved_by, moved_at, is_current
  FROM item_locations_temp;

DROP TABLE item_locations_temp;

CREATE INDEX idx_item_locations_home_id ON public.item_locations (home_id);
CREATE INDEX idx_item_locations_item_id ON public.item_locations (item_id);
CREATE INDEX idx_item_locations_location_id ON public.item_locations (location_id);

-- ============================================================================
-- STEP 7: Rebuild photos table with home_id
-- ============================================================================
CREATE TABLE photos_temp AS SELECT * FROM public.photos;

DROP TABLE public.photos CASCADE;

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  item_id UUID NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT photos_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT photos_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);

INSERT INTO public.photos (id, home_id, item_id, s3_key, uploaded_by, uploaded_at)
  SELECT id, '00000000-0000-0000-0000-000000000001', item_id, s3_key, uploaded_by, uploaded_at
  FROM photos_temp;

DROP TABLE photos_temp;

CREATE INDEX idx_photos_home_id ON public.photos (home_id);
CREATE INDEX idx_photos_item_id ON public.photos (item_id);
CREATE INDEX idx_photos_uploaded_by ON public.photos (uploaded_by);

-- ============================================================================
-- STEP 8: Rebuild tags table with home_id
-- ============================================================================
CREATE TABLE tags_temp AS SELECT * FROM public.tags;

DROP TABLE public.tags CASCADE;

CREATE TABLE public.tags (
  photo_id UUID NOT NULL,
  tag_name VARCHAR(255) NOT NULL,
  home_id UUID NOT NULL,
  PRIMARY KEY (photo_id, tag_name),
  CONSTRAINT tags_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT tags_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos(id)
);

INSERT INTO public.tags (photo_id, tag_name, home_id)
  SELECT photo_id, tag_name, '00000000-0000-0000-0000-000000000001'
  FROM tags_temp;

DROP TABLE tags_temp;

CREATE INDEX idx_tags_home_id ON public.tags (home_id);
CREATE INDEX idx_tags_photo_id ON public.tags (photo_id);

-- ============================================================================
-- STEP 9: Rebuild activity_log table with home_id
-- ============================================================================
CREATE TABLE activity_log_temp AS SELECT * FROM public.activity_log;

DROP TABLE public.activity_log CASCADE;

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL,
  item_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  CONSTRAINT activity_log_home_id_fkey FOREIGN KEY (home_id) REFERENCES public.homes(id),
  CONSTRAINT activity_log_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT activity_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

INSERT INTO public.activity_log (id, home_id, item_id, action, changed_by, changed_at, details)
  SELECT id, '00000000-0000-0000-0000-000000000001', item_id, action, changed_by, changed_at, details
  FROM activity_log_temp;

DROP TABLE activity_log_temp;

CREATE INDEX idx_activity_log_home_id ON public.activity_log (home_id);
CREATE INDEX idx_activity_log_item_id ON public.activity_log (item_id);
CREATE INDEX idx_activity_log_changed_at ON public.activity_log (changed_at);

-- ============================================================================
-- STEP 10: Recreate triggers
-- ============================================================================
CREATE TRIGGER tr_audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_categories();

CREATE TRIGGER tr_audit_items
  AFTER INSERT OR UPDATE OR DELETE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_items();

-- ============================================================================
-- STEP 11: Verify foreign key integrity
-- ============================================================================
ALTER TABLE public.photos VALIDATE CONSTRAINT photos_home_id_fkey;
ALTER TABLE public.users VALIDATE CONSTRAINT users_home_id_fkey;
ALTER TABLE public.categories VALIDATE CONSTRAINT categories_home_id_fkey;
ALTER TABLE public.locations VALIDATE CONSTRAINT locations_home_id_fkey;
ALTER TABLE public.items VALIDATE CONSTRAINT items_home_id_fkey;
ALTER TABLE public.item_locations VALIDATE CONSTRAINT item_locations_home_id_fkey;
ALTER TABLE public.activity_log VALIDATE CONSTRAINT activity_log_home_id_fkey;
ALTER TABLE public.tags VALIDATE CONSTRAINT tags_home_id_fkey;

-- ============================================================================
-- Complete
-- ============================================================================
COMMIT;