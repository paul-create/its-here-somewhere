CREATE OR REPLACE PROCEDURE sp_createLocation(
  p_home_id UUID,
  p_name VARCHAR,
  p_parent_location_id UUID,
  p_is_private BOOLEAN,
  p_user_id UUID,
  OUT p_location_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Circular reference check
  IF p_parent_location_id = p_location_id THEN
    p_success := FALSE;
    p_message := 'Cannot be own parent';
    RETURN;
  END IF;

  INSERT INTO locations (home_id, name, parent_location_id, created_by, is_private, created_at, updated_at)
  VALUES (p_home_id, p_name, p_parent_location_id, p_user_id, COALESCE(p_is_private, FALSE), NOW(), NOW())
  RETURNING id INTO p_location_id;

  p_success := TRUE;
  p_message := 'Location created';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;