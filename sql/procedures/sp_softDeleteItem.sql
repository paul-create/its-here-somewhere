CREATE OR REPLACE PROCEDURE sp_softDeleteItem(
  p_item_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_item items;
BEGIN
  -- Check ownership
  SELECT * INTO v_item FROM items WHERE id = p_item_id AND home_id = p_home_id AND created_by = p_user_id;
  
  IF v_item IS NULL THEN
    p_success := FALSE;
    p_message := 'Item not found';
    RETURN;
  END IF;

  -- Insert into deleted table
  INSERT INTO _deleted.items_deleted (id, home_id, category_id, name, description, quantity, created_by, deleted_by, original_created_at, original_updated_at)
  VALUES (v_item.id, v_item.home_id, v_item.category_id, v_item.name, v_item.description, v_item.quantity, v_item.created_by, p_user_id, v_item.created_at, v_item.updated_at);

  -- Delete in FK-safe order
  DELETE FROM tags WHERE photo_id IN (SELECT id FROM photos WHERE item_id = p_item_id);
  DELETE FROM photos WHERE item_id = p_item_id;
  DELETE FROM item_locations WHERE item_id = p_item_id;
  DELETE FROM activity_log WHERE item_id = p_item_id;
  DELETE FROM items WHERE id = p_item_id;

  p_success := TRUE;
  p_message := 'Item deleted';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;