CREATE OR REPLACE PROCEDURE sp_softDeletePhoto(
  p_photo_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_photo photos;
  v_item_created_by UUID;
BEGIN
  -- Get photo
  SELECT * INTO v_photo FROM photos WHERE id = p_photo_id AND home_id = p_home_id;
  
  IF v_photo IS NULL THEN
    p_success := FALSE;
    p_message := 'Photo not found';
    RETURN;
  END IF;

  -- Check authorization (must be item creator)
  SELECT created_by INTO v_item_created_by FROM items WHERE id = v_photo.item_id;
  
  IF v_item_created_by != p_user_id THEN
    p_success := FALSE;
    p_message := 'Not authorised';
    RETURN;
  END IF;

  -- Insert into deleted table
  INSERT INTO _deleted.photos_deleted (id, home_id, item_id, s3_key, uploaded_by, deleted_by, original_created_at)
  VALUES (v_photo.id, v_photo.home_id, v_photo.item_id, v_photo.s3_key, v_photo.uploaded_by, p_user_id, v_photo.created_at);

  -- Delete tags
  DELETE FROM tags WHERE photo_id = p_photo_id;

  -- Delete photo
  DELETE FROM photos WHERE id = p_photo_id;

  p_success := TRUE;
  p_message := 'Photo deleted';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;