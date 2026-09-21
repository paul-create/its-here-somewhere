
CREATE OR REPLACE PROCEDURE sp_updateLocation(
  p_location_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  p_name VARCHAR DEFAULT NULL,
  p_parent_location_id UUID DEFAULT NULL,
  p_is_private BOOLEAN DEFAULT NULL,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_location locations;
BEGIN
  -- Get location
  SELECT * INTO v_location FROM locations WHERE id = p_location_id AND home_id = p_home_id;
  
  IF v_location IS NULL THEN
    p_success := FALSE;
    p_message := 'Location not found';
    RETURN;
  END IF;

  -- Check authorization (must be creator or public can be updated by anyone? - following current pattern: only creator)
  IF v_location.created_by != p_user_id THEN
    p_success := FALSE;
    p_message := 'Not authorised';
    RETURN;
  END IF;

  -- Circular reference check
  IF p_parent_location_id = p_location_id THEN
    p_success := FALSE;
    p_message := 'Cannot be own parent';
    RETURN;
  END IF;

  UPDATE locations 
  SET 
    name = COALESCE(p_name, name),
    parent_location_id = COALESCE(p_parent_location_id, parent_location_id),
    is_private = COALESCE(p_is_private, is_private),
    updated_at = NOW()
  WHERE id = p_location_id;

  p_success := TRUE;
  p_message := 'Location updated';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;