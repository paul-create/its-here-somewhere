CREATE OR REPLACE PROCEDURE sp_getItemByID(
  p_item_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT i.*, il.location_id 
  FROM items i
  JOIN categories c ON i.category_id = c.id
  LEFT JOIN LATERAL (
    SELECT location_id FROM item_locations 
    WHERE item_id = i.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) il ON true
  WHERE i.id = p_item_id 
    AND i.home_id = p_home_id
    AND ((c.is_private = false) OR (c.created_by = p_user_id));
END;
$$;