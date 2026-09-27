CREATE OR REPLACE PROCEDURE sp_deleteTag(
  p_tag_id UUID,
  p_photo_id UUID,
  p_home_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tag_exists BOOLEAN;
BEGIN
  -- Verify photo exists in this home
  SELECT EXISTS(SELECT 1 FROM photos WHERE id = p_photo_id AND home_id = p_home_id)
  INTO v_tag_exists;
  
  IF NOT v_tag_exists THEN
    p_success := FALSE;
    p_message := 'Photo not found';
    RETURN;
  END IF;

  -- Delete the tag
  DELETE FROM tags 
  WHERE id = p_tag_id AND photo_id = p_photo_id;

  IF NOT FOUND THEN
    p_success := FALSE;
    p_message := 'Tag not found';
    RETURN;
  END IF;

  p_success := TRUE;
  p_message := 'Tag deleted successfully';
EXCEPTION 
  WHEN OTHERS THEN
    p_success := FALSE;
    p_message := SQLERRM;
END;
$$;