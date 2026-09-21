CREATE OR REPLACE PROCEDURE sp_searchItems(
  p_home_id UUID,
  p_user_id UUID,
  p_query VARCHAR,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT DISTINCT
    i.id,
    i.name,
    i.description,
    i.quantity,
    i.created_by,
    c.id as category_id,
    c.name as category_name,
    c.is_private as category_is_private,
    i.created_at
  FROM items i
  JOIN categories c ON i.category_id = c.id
  LEFT JOIN tags t ON EXISTS (
    SELECT 1 FROM photos p 
    WHERE p.item_id = i.id 
    AND t.photo_id = p.id
  )
  WHERE i.home_id = p_home_id
    AND (
      i.name ILIKE ('%' || p_query || '%')
      OR i.description ILIKE ('%' || p_query || '%')
      OR t.tag_name ILIKE ('%' || p_query || '%')
    )
    AND ((c.is_private = false) OR (c.created_by = p_user_id))
  ORDER BY i.created_at DESC
  LIMIT 50;
END;
$$;