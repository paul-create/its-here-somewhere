-- Migration: Drop item procedures whose parameter lists have changed
-- Date: 2026-09-22
-- Purpose: CREATE OR REPLACE cannot change a procedure's parameters or OUT types,
--          so these are dropped first and recreated by the normal deploy.
-- Run BEFORE ./sql/scripts/deploy.sh

BEGIN;

DROP PROCEDURE IF EXISTS sp_getallitems;       -- new paging/visibility params
DROP PROCEDURE IF EXISTS sp_createitem;        -- OUT p_error_code, p_message, p_item_id
DROP PROCEDURE IF EXISTS sp_updateitem;        -- OUT p_success -> p_error_code
DROP PROCEDURE IF EXISTS sp_softdeleteitem;    -- OUT p_success -> p_error_code
DROP PROCEDURE IF EXISTS sp_moveitemlocation;  -- OUT p_success -> p_error_code

COMMIT;