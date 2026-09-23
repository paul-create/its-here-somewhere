CREATE OR REPLACE PROCEDURE sp_createItem(
  p_home_id UUID,
  p_category_id UUID,
  p_name VARCHAR,
  p_description TEXT,
  p_quantity INTEGER,
  p_location_id UUID,
  p_user_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR,
  OUT p_item_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_name VARCHAR;
  v_location_name VARCHAR;
BEGIN
  -- Category must be in this home and visible to this user
  SELECT name INTO v_category_name
  FROM categories
  WHERE id = p_category_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'INVALID';
    p_message := 'Category not found';
    RETURN;
  END IF;

  -- Location must be in this home and visible to this user
  SELECT name INTO v_location_name
  FROM locations
  WHERE id = p_location_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'INVALID';
    p_message := 'Location not found';
    RETURN;
  END IF;

  INSERT INTO items (id, home_id, category_id, name, description, quantity, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), p_home_id, p_category_id, p_name, p_description, COALESCE(p_quantity, 1), p_user_id, NOW(), NOW())
  RETURNING id INTO p_item_id;

  INSERT INTO item_locations (id, home_id, item_id, location_id, moved_by, stored_at, created_at)
  VALUES (gen_random_uuid(), p_home_id, p_item_id, p_location_id, p_user_id, NOW(), NOW());

  INSERT INTO activity_log (id, home_id, item_id, changed_by, changed_at, property, old_value, new_value, created_at)
  VALUES
    (gen_random_uuid(), p_home_id, p_item_id, p_user_id, NOW(), 'Category', NULL, v_category_name, NOW()),
    (gen_random_uuid(), p_home_id, p_item_id, p_user_id, NOW(), 'Location', NULL, v_location_name, NOW());

  p_message := 'Item created';
END;
$$;