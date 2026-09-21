CREATE OR REPLACE PROCEDURE sp_searchCategories(
  p_home_id UUID,
  p_user_id UUID,
  p_query VARCHAR,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT
    id,
    name,
    is_private,
    created_by,
    created_at
  FROM categories
  WHERE home_id = p_home_id
    AND name ILIKE ('%' || p_query || '%')
    AND ((is_private = false) OR (created_by = p_user_id))
  ORDER BY created_at DESC
  LIMIT 50;
END;
$$;