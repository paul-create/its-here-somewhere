CREATE OR REPLACE PROCEDURE sp_softDeleteCategory(
  p_category_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_category categories;
  v_item_count INTEGER;
BEGIN
  SELECT * INTO v_category
  FROM categories
  WHERE id = p_category_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'NOT_FOUND';
    p_message := 'Category not found';
    RETURN;
  END IF;

  IF v_category.created_by <> p_user_id THEN
    p_error_code := 'FORBIDDEN';
    p_message := 'Only the person who created this category can delete it';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_item_count FROM items WHERE category_id = p_category_id;

  IF v_item_count > 0 THEN
    p_error_code := 'INVALID';
    p_message := FORMAT('Cannot delete category - %s item(s) still use it', v_item_count);
    RETURN;
  END IF;

  INSERT INTO _deleted.categories_deleted (
    id, home_id, name, created_by, is_private,
    deleted_by, original_created_at, original_updated_at
  )
  VALUES (
    v_category.id, v_category.home_id, v_category.name, v_category.created_by, COALESCE(v_category.is_private, false),
    p_user_id, v_category.created_at, v_category.updated_at
  );

  DELETE FROM categories WHERE id = p_category_id;

  p_message := 'Category deleted';
END;
$$;