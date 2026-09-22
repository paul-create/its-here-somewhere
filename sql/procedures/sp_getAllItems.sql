CREATE OR REPLACE PROCEDURE sp_getAllItems(
  p_home_id UUID,
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_is_private BOOLEAN DEFAULT NULL,
  p_page_size INTEGER DEFAULT 5,
  p_offset INTEGER DEFAULT 0,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT
    i.id,
    i.name,
    i.description,
    i.quantity,
    i.category_id,
    c.name AS category_name,
    COALESCE(c.is_private, false) AS category_is_private,
    il.location_id,
    CASE
      WHEN COALESCE(l.is_private, false) = false OR l.created_by = p_user_id THEN l.name
    END AS location_name,
    ph.s3_key AS photo_s3_key,
    i.created_by,
    i.created_at,
    i.updated_at,
    COUNT(*) OVER() AS total_count
  FROM items i
  JOIN categories c ON c.id = i.category_id
  LEFT JOIN LATERAL (
    SELECT location_id
    FROM item_locations
    WHERE item_id = i.id
    ORDER BY created_at DESC
    LIMIT 1
  ) il ON true
  LEFT JOIN locations l ON l.id = il.location_id
  LEFT JOIN LATERAL (
    SELECT s3_key
    FROM photos
    WHERE item_id = i.id
    ORDER BY created_at DESC
    LIMIT 1
  ) ph ON true
  WHERE i.home_id = p_home_id
    AND (COALESCE(c.is_private, false) = false OR c.created_by = p_user_id)
    AND (p_category_id IS NULL OR i.category_id = p_category_id)
    AND (p_is_private IS NULL OR COALESCE(c.is_private, false) = p_is_private)
  ORDER BY i.created_at DESC, i.id DESC
  LIMIT p_page_size OFFSET p_offset;
END;
$$;