CREATE OR REPLACE PROCEDURE sp_softDeleteLocation(
  p_location_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_location locations;
  v_item_count INTEGER;
BEGIN
  -- Get location
  SELECT * INTO v_location FROM locations WHERE id = p_location_id AND home_id = p_home_id;
  
  IF v_location IS NULL THEN
    p_success := FALSE;
    p_message := 'Location not found';
    RETURN;
  END IF;

  -- Check authorization
  IF v_location.created_by != p_user_id THEN
    p_success := FALSE;
    p_message := 'Not authorised';
    RETURN;
  END IF;

  -- Check if location has items
  SELECT COUNT(*) INTO v_item_count FROM item_locations WHERE location_id = p_location_id;
  
  IF v_item_count > 0 THEN
    p_success := FALSE;
    p_message := 'Location has items, cannot delete';
    RETURN;
  END IF;

  -- Insert into deleted table
  INSERT INTO _deleted.locations_deleted (id, home_id, name, parent_location_id, created_by, is_private, deleted_by, original_created_at, original_updated_at)
  VALUES (v_location.id, v_location.home_id, v_location.name, v_location.parent_location_id, v_location.created_by, v_location.is_private, p_user_id, v_location.created_at, v_location.updated_at);

  -- Delete
  DELETE FROM locations WHERE id = p_location_id;

  p_success := TRUE;
  p_message := 'Location deleted';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;