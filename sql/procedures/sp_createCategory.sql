CREATE OR REPLACE PROCEDURE sp_createCategory(
  p_home_id UUID,
  p_name VARCHAR,
  p_is_private BOOLEAN,
  p_user_id UUID,
  OUT p_error_code VARCHAR,
  OUT p_message VARCHAR,
  OUT p_category_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- No duplicate names among the categories this user can see (public ones + their own)
  IF EXISTS (
    SELECT 1
    FROM categories
    WHERE home_id = p_home_id
      AND LOWER(name) = LOWER(p_name)
      AND (COALESCE(is_private, false) = false OR created_by = p_user_id)
  ) THEN
    p_error_code := 'INVALID';
    p_message := 'A category with that name already exists';
    RETURN;
  END IF;

  INSERT INTO categories (home_id, name, created_by, is_private, created_at, updated_at)
  VALUES (p_home_id, p_name, p_user_id, COALESCE(p_is_private, false), NOW(), NOW())
  RETURNING id INTO p_category_id;

  p_message := 'Category created';
END;
$$;