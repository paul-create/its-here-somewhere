CREATE OR REPLACE PROCEDURE sp_updateLocation(
  p_location_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  p_name VARCHAR,
  p_update_parent BOOLEAN,
  p_parent_location_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_created_by UUID;
  v_name VARCHAR;
BEGIN
  -- Privacy is fixed at creation, so only the name and parent can change
  SELECT created_by, name
  INTO v_created_by, v_name
  FROM locations
  WHERE id = p_location_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'NOT_FOUND';
    p_message := 'Location not found';
    RETURN;
  END IF;

  IF v_created_by <> p_user_id THEN
    p_error_code := 'FORBIDDEN';
    p_message := 'Only the person who created this location can change it';
    RETURN;
  END IF;

  -- New name must not clash with another location this user can see
  IF p_name IS NOT NULL
     AND LOWER(p_name) <> LOWER(v_name)
     AND EXISTS (
       SELECT 1
       FROM locations
       WHERE home_id = p_home_id
         AND id <> p_location_id
         AND LOWER(name) = LOWER(p_name)
         AND (COALESCE(is_private, false) = false OR created_by = p_user_id)
     ) THEN
    p_error_code := 'INVALID';
    p_message := 'A location with that name already exists';
    RETURN;
  END IF;

  -- New parent: must exist, must not be itself or one of its own sub-locations
  IF p_update_parent AND p_parent_location_id IS NOT NULL THEN
    IF p_parent_location_id = p_location_id THEN
      p_error_code := 'INVALID';
      p_message := 'A location can''t be its own parent';
      RETURN;
    END IF;

    PERFORM 1
    FROM locations
    WHERE id = p_parent_location_id
      AND home_id = p_home_id
      AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

    IF NOT FOUND THEN
      p_error_code := 'INVALID';
      p_message := 'Parent location not found';
      RETURN;
    END IF;

    IF EXISTS (
      WITH RECURSIVE descendants AS (
        SELECT id FROM locations WHERE parent_location_id = p_location_id
        UNION ALL
        SELECT l.id FROM locations l JOIN descendants d ON l.parent_location_id = d.id
      )
      SELECT 1 FROM descendants WHERE id = p_parent_location_id
    ) THEN
      p_error_code := 'INVALID';
      p_message := 'A location can''t be moved inside one of its own sub-locations';
      RETURN;
    END IF;
  END IF;

  UPDATE locations
  SET
    name = COALESCE(p_name, name),
    parent_location_id = CASE WHEN p_update_parent THEN p_parent_location_id ELSE parent_location_id END,
    updated_at = NOW()
  WHERE id = p_location_id;

  p_message := 'Location updated';
END;
$$;