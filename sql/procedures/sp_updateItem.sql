CREATE OR REPLACE PROCEDURE sp_updateItem(
  p_item_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  p_name VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_quantity INTEGER DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_category_id UUID;
  v_old_category_name VARCHAR;
  v_new_category_name VARCHAR;
BEGIN
  -- Only the creator can edit
  SELECT category_id INTO v_old_category_id
  FROM items
  WHERE id = p_item_id
    AND home_id = p_home_id
    AND created_by = p_user_id;

  IF NOT FOUND THEN
    p_error_code := 'NOT_FOUND';
    p_message := 'Item not found';
    RETURN;
  END IF;

  -- Category change: validate new category, then log it
  IF p_category_id IS NOT NULL AND p_category_id <> v_old_category_id THEN
    SELECT name INTO v_new_category_name
    FROM categories
    WHERE id = p_category_id
      AND home_id = p_home_id
      AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

    IF NOT FOUND THEN
      p_error_code := 'INVALID';
      p_message := 'Category not found';
      RETURN;
    END IF;

    SELECT name INTO v_old_category_name FROM categories WHERE id = v_old_category_id;

    INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value, created_at)
    VALUES (p_home_id, p_item_id, p_user_id, NOW(), 'Category', v_old_category_name, v_new_category_name, NOW());
  END IF;

  -- Name and description changes are logged by tr_audit_items
  UPDATE items
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    quantity = COALESCE(p_quantity, quantity),
    category_id = COALESCE(p_category_id, category_id),
    updated_at = NOW()
  WHERE id = p_item_id;

  p_message := 'Item updated';
END;
$$;