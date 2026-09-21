-- Soft delete schema for audit and recovery
CREATE SCHEMA IF NOT EXISTS _deleted;
COMMENT ON SCHEMA _deleted IS 'Soft-deleted records for audit trail and recovery';