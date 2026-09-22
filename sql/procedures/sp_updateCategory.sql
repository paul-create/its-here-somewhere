CREATE OR REPLACE PROCEDURE sp_updateCategory(
  p_category_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  p_name VARCHAR,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_created_by UUID;
  v_name VARCHAR;
BEGIN
  -- Privacy is fixed at creation, so only the name can change
  SELECT created_by, name
  INTO v_created_by, v_name
  FROM categories
  WHERE id = p_category_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);

  IF NOT FOUND THEN
    p_error_code := 'NOT_FOUND';
    p_message := 'Category not found';
    RETURN;
  END IF;

  IF v_created_by <> p_user_id THEN
    p_error_code := 'FORBIDDEN';
    p_message := 'Only the person who created this category can change it';
    RETURN;
  END IF;

  -- New name must not clash with another category this user can see
  IF LOWER(p_name) <> LOWER(v_name)
     AND EXISTS (
       SELECT 1
       FROM categories
       WHERE home_id = p_home_id
         AND id <> p_category_id
         AND LOWER(name) = LOWER(p_name)
         AND (COALESCE(is_private, false) = false OR created_by = p_user_id)
     ) THEN
    p_error_code := 'INVALID';
    p_message := 'A category with that name already exists';
    RETURN;
  END IF;

  UPDATE categories
  SET
    name = p_name,
    updated_at = NOW()
  WHERE id = p_category_id;

  p_message := 'Category updated';
END;
$$;