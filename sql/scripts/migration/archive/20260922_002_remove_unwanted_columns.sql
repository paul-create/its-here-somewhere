-- Migration: Align production schema with tables.sql definitions
-- Date: 2026-09-22
-- Purpose: Remove unused columns left over from earlier failed migration attempts,
--          tighten constraints to match target schema
-- Strategy: Simple ALTER TABLE only - no rebuilding, no data risk

BEGIN;

-- ============================================================================
-- USERS: remove unused auth columns (Cognito handles auth, not us)
-- ============================================================================
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.users DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.users DROP COLUMN IF EXISTS updated_at;

-- Tighten cognito_user_id to match users.sql (confirmed: no NULLs, no duplicates)
ALTER TABLE public.users ALTER COLUMN cognito_user_id SET NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_cognito_user_id_key UNIQUE (cognito_user_id);

-- ============================================================================
-- CATEGORIES: remove unused columns (not referenced anywhere in categories.js)
-- ============================================================================
ALTER TABLE public.categories DROP COLUMN IF EXISTS color;
ALTER TABLE public.categories DROP COLUMN IF EXISTS icon;

-- ============================================================================
-- Complete
-- ============================================================================
COMMIT;