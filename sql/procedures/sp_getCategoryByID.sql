CREATE OR REPLACE PROCEDURE sp_getCategoryByID(
  p_category_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT id, name, created_by, is_private, created_at
  FROM categories
  WHERE id = p_category_id 
    AND home_id = p_home_id
    AND ((is_private = false) OR (created_by = p_user_id));
END;
$$;