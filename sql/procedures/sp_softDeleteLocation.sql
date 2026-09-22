CREATE OR REPLACE PROCEDURE sp_softDeleteLocation(
  p_location_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_location locations;
BEGIN
  SELECT * INTO v_location
  FROM locations
  WHERE id = p_location_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'NOT_FOUND';
    p_message := 'Location not found';
    RETURN;
  END IF;

  IF v_location.created_by <> p_user_id THEN
    p_error_code := 'FORBIDDEN';
    p_message := 'Only the person who created this location can delete it';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM locations WHERE parent_location_id = p_location_id) THEN
    p_error_code := 'INVALID';
    p_message := 'Move or delete its sub-locations first';
    RETURN;
  END IF;

  -- Any item history here (current or past) blocks deletion, so move history is never lost
  IF EXISTS (SELECT 1 FROM item_locations WHERE location_id = p_location_id) THEN
    p_error_code := 'INVALID';
    p_message := 'This location has items or item history, so it can''t be deleted';
    RETURN;
  END IF;

  INSERT INTO _deleted.locations_deleted (
    id, home_id, name, parent_location_id, created_by, is_private,
    deleted_by, original_created_at, original_updated_at
  )
  VALUES (
    v_location.id, v_location.home_id, v_location.name, v_location.parent_location_id,
    v_location.created_by, COALESCE(v_location.is_private, false),
    p_user_id, v_location.created_at, v_location.updated_at
  );

  DELETE FROM locations WHERE id = p_location_id;

  p_message := 'Location deleted';
END;
$$;