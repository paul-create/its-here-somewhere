CREATE OR REPLACE PROCEDURE sp_addTag(
  p_photo_id UUID,
  p_home_id UUID,
  p_tag_name VARCHAR,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR,
  OUT p_tag_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_photo_exists BOOLEAN;
BEGIN
  -- Verify photo exists in this home
  SELECT EXISTS(SELECT 1 FROM photos WHERE id = p_photo_id AND home_id = p_home_id)
  INTO v_photo_exists;
  
  IF NOT v_photo_exists THEN
    p_success := FALSE;
    p_message := 'Photo not found';
    RETURN;
  END IF;

  -- Insert the tag (unique constraint will prevent duplicates)
  p_tag_id := gen_random_uuid();
  INSERT INTO tags (id, photo_id, tag_name, is_auto_generated, created_at)
  VALUES (p_tag_id, p_photo_id, LOWER(TRIM(p_tag_name)), false, NOW());

  p_success := TRUE;
  p_message := 'Tag added successfully';
EXCEPTION WHEN UNIQUE_VIOLATION THEN
  p_success := FALSE;
  p_message := 'Tag already exists for this photo';
  p_tag_id := NULL;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
  p_tag_id := NULL;
END;
$$;