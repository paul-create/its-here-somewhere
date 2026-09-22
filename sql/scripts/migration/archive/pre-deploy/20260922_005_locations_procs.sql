-- Migration: Location procedures (plus category clean-up that 004 should have done)
-- Date: 2026-09-22
-- Purpose:
--   1. Drop location write procs whose parameters / OUT parameters changed,
--      so the normal deploy can recreate them.
--   2. Repeat the 004 category drops. The archived 004 file contained the 003
--      item-proc script by mistake, so these may never have run.
--      All drops are IF EXISTS, so this is safe either way; the deploy recreates the procs.
-- Run BEFORE ./sql/scripts/deploy.sh

BEGIN;

-- Locations
DROP PROCEDURE IF EXISTS sp_createlocation;
DROP PROCEDURE IF EXISTS sp_updatelocation;
DROP PROCEDURE IF EXISTS sp_softdeletelocation;

-- Categories (from 004)
DROP PROCEDURE IF EXISTS sp_createcategory;
DROP PROCEDURE IF EXISTS sp_updatecategory;
DROP PROCEDURE IF EXISTS sp_softdeletecategory;
DROP TRIGGER IF EXISTS tr_audit_categories ON categories;
DROP FUNCTION IF EXISTS fn_audit_categories();

COMMIT;