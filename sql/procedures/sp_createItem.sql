CREATE OR REPLACE PROCEDURE sp_createItem(
  p_home_id UUID,
  p_category_id UUID,
  p_name VARCHAR,
  p_description TEXT,
  p_quantity INTEGER,
  p_location_id UUID,
  p_user_id UUID,
  OUT p_item_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_name VARCHAR;
  v_location_name VARCHAR;
BEGIN
  -- Create item
  INSERT INTO items (home_id, category_id, name, description, quantity, created_by, created_at, updated_at)
  VALUES (p_home_id, p_category_id, p_name, p_description, COALESCE(p_quantity, 1), p_user_id, NOW(), NOW())
  RETURNING id INTO p_item_id;

  -- Create item_location record
  INSERT INTO item_locations (home_id, item_id, location_id, moved_by, stored_at, created_at)
  VALUES (p_home_id, p_item_id, p_location_id, p_user_id, NOW(), NOW());

  -- Log activity - Category
  SELECT name INTO v_category_name FROM categories WHERE id = p_category_id;
  INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value)
  VALUES (p_home_id, p_item_id, p_user_id, NOW(), 'Category', NULL, v_category_name);

  -- Log activity - Location
  SELECT name INTO v_location_name FROM locations WHERE id = p_location_id;
  INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value)
  VALUES (p_home_id, p_item_id, p_user_id, NOW(), 'Location', NULL, v_location_name);

  COMMIT;
END;
$$;