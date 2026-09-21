CREATE OR REPLACE PROCEDURE sp_updateItem(
  p_item_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  p_name VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_quantity INTEGER DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_item items;
  v_old_category_name VARCHAR;
  v_new_category_name VARCHAR;
BEGIN
  -- Check ownership
  SELECT * INTO v_item FROM items WHERE id = p_item_id AND home_id = p_home_id AND created_by = p_user_id;
  
  IF v_item IS NULL THEN
    p_success := FALSE;
    p_message := 'Item not found';
    RETURN;
  END IF;

  -- Log category change if it happened
  IF p_category_id IS NOT NULL AND p_category_id != v_item.category_id THEN
    SELECT name INTO v_old_category_name FROM categories WHERE id = v_item.category_id;
    SELECT name INTO v_new_category_name FROM categories WHERE id = p_category_id;
    INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value)
    VALUES (p_home_id, p_item_id, p_user_id, NOW(), 'Category', v_old_category_name, v_new_category_name);
  END IF;

  -- Update item
  UPDATE items 
  SET 
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    quantity = COALESCE(p_quantity, quantity),
    category_id = COALESCE(p_category_id, category_id),
    updated_at = NOW()
  WHERE id = p_item_id;

  p_success := TRUE;
  p_message := 'Item updated';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;