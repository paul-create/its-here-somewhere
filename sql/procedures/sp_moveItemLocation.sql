CREATE OR REPLACE PROCEDURE sp_moveItemLocation(
  p_item_id UUID,
  p_home_id UUID,
  p_location_id UUID,
  p_user_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_item items;
  v_old_location_id UUID;
  v_old_location_name VARCHAR;
  v_new_location_name VARCHAR;
BEGIN
  -- Check ownership
  SELECT * INTO v_item FROM items WHERE id = p_item_id AND home_id = p_home_id AND created_by = p_user_id;
  
  IF v_item IS NULL THEN
    p_success := FALSE;
    p_message := 'Item not found';
    RETURN;
  END IF;

  -- Get old location
  SELECT location_id INTO v_old_location_id 
  FROM item_locations 
  WHERE item_id = p_item_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_old_location_id IS NOT NULL THEN
    SELECT name INTO v_old_location_name FROM locations WHERE id = v_old_location_id;
  ELSE
    v_old_location_name := 'None';
  END IF;

  SELECT name INTO v_new_location_name FROM locations WHERE id = p_location_id;

  -- Create new item_location record
  INSERT INTO item_locations (home_id, item_id, location_id, moved_by, stored_at, created_at)
  VALUES (p_home_id, p_item_id, p_location_id, p_user_id, NOW(), NOW());

  -- Log activity
  INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value)
  VALUES (p_home_id, p_item_id, p_user_id, NOW(), 'Location', v_old_location_name, v_new_location_name);

  p_success := TRUE;
  p_message := 'Item moved';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;