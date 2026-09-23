CREATE OR REPLACE PROCEDURE sp_moveItemLocation(
  p_item_id UUID,
  p_home_id UUID,
  p_location_id UUID,
  p_user_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_location_id UUID;
  v_old_location_name VARCHAR := 'None';
  v_new_location_name VARCHAR;
BEGIN
  -- Anyone in the home who can see the item can move it
  PERFORM 1
  FROM items i
  JOIN categories c ON c.id = i.category_id
  WHERE i.id = p_item_id
    AND i.home_id = p_home_id
    AND (COALESCE(c.is_private, false) = false OR c.created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'NOT_FOUND';
    p_message := 'Item not found';
    RETURN;
  END IF;

  -- New location must be in this home and visible to this user
  SELECT name INTO v_new_location_name
  FROM locations
  WHERE id = p_location_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'INVALID';
    p_message := 'Location not found';
    RETURN;
  END IF;

  SELECT location_id INTO v_old_location_id
  FROM item_locations
  WHERE item_id = p_item_id
  ORDER BY created_at DESC NULLS LAST
  LIMIT 1;

  IF v_old_location_id = p_location_id THEN
    p_error_code := 'INVALID';
    p_message := 'Item is already in that location';
    RETURN;
  END IF;

  IF v_old_location_id IS NOT NULL THEN
    SELECT name INTO v_old_location_name FROM locations WHERE id = v_old_location_id;
  ELSE
    v_old_location_name := 'None';
  END IF;

  INSERT INTO item_locations (id, home_id, item_id, location_id, moved_by, stored_at, created_at)
  VALUES (gen_random_uuid(), p_home_id, p_item_id, p_location_id, p_user_id, NOW(), NOW());

  INSERT INTO activity_log (id, home_id, item_id, changed_by, changed_at, property, old_value, new_value, created_at)
  VALUES (gen_random_uuid(), p_home_id, p_item_id, p_user_id, NOW(), 'Location', v_old_location_name, v_new_location_name, NOW());

  p_message := 'Item moved';
END;
$$;