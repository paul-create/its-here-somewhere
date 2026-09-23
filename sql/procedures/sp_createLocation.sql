CREATE OR REPLACE PROCEDURE sp_createLocation(
  p_home_id UUID,
  p_name VARCHAR,
  p_parent_location_id UUID,
  p_is_private BOOLEAN,
  p_user_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR,
  OUT p_location_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Parent (if given) must be in this home and visible to this user
  IF p_parent_location_id IS NOT NULL THEN
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
  END IF;

  -- No duplicate names among the locations this user can see (public ones + their own)
  IF EXISTS (
    SELECT 1
    FROM locations
    WHERE home_id = p_home_id
      AND LOWER(name) = LOWER(p_name)
      AND (COALESCE(is_private, false) = false OR created_by = p_user_id)
  ) THEN
    p_error_code := 'INVALID';
    p_message := 'A location with that name already exists';
    RETURN;
  END IF;

  INSERT INTO locations (id, home_id, name, parent_location_id, created_by, is_private, created_at, updated_at)
  VALUES (gen_random_uuid(), p_home_id, p_name, p_parent_location_id, p_user_id, COALESCE(p_is_private, false), NOW(), NOW())
  RETURNING id INTO p_location_id;

  p_message := 'Location created';
END;
$$;