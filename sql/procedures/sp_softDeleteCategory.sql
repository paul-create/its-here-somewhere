CREATE OR REPLACE PROCEDURE sp_softDeleteCategory(
  p_category_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_category categories;
  v_item_count INTEGER;
BEGIN
  -- Check ownership
  SELECT * INTO v_category FROM categories WHERE id = p_category_id AND home_id = p_home_id AND created_by = p_user_id;
  
  IF v_category IS NULL THEN
    p_success := FALSE;
    p_message := 'Category not found or not authorised';
    RETURN;
  END IF;

  -- Check if items use this category
  SELECT COUNT(*) INTO v_item_count FROM items WHERE category_id = p_category_id;
  
  IF v_item_count > 0 THEN
    p_success := FALSE;
    p_message := FORMAT('Cannot delete category - %s item(s) still use it', v_item_count);
    RETURN;
  END IF;

  -- Insert into deleted table
  INSERT INTO _deleted.categories_deleted (id, home_id, name, created_by, is_private, deleted_by, original_created_at, original_updated_at)
  VALUES (v_category.id, v_category.home_id, v_category.name, v_category.created_by, v_category.is_private, p_user_id, v_category.created_at, v_category.updated_at);

  -- Delete
  DELETE FROM categories WHERE id = p_category_id;

  p_success := TRUE;
  p_message := 'Category deleted';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;