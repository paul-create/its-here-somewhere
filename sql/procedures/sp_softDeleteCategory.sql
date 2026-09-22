-- Migration: Category procedures and audit trigger
-- Date: 2026-09-22
-- Purpose:
--   1. Drop category write procs whose parameters / OUT parameters changed
--      (p_success -> p_error_code; sp_updateCategory no longer takes p_is_private),
--      so the normal deploy can recreate them.
--   2. Remove tr_audit_categories. It inserts into activity_log without item_id,
--      which is NOT NULL, so every category rename currently fails.
--      activity_log is per item, so there is nowhere valid for it to write.
-- Run BEFORE ./sql/scripts/deploy.sh, and delete sql/triggers/tr_audit_categories.sql
-- from the repo so the deploy doesn't recreate it.

BEGIN;

DROP PROCEDURE IF EXISTS sp_createcategory;
DROP PROCEDURE IF EXISTS sp_updatecategory;
DROP PROCEDURE IF EXISTS sp_softdeletecategory;

DROP TRIGGER IF EXISTS tr_audit_categories ON categories;
DROP FUNCTION IF EXISTS fn_audit_categories();

COMMIT;