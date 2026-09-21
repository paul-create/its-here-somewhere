CREATE OR REPLACE PROCEDURE sp_getAllPhotos(
  p_home_id UUID,
  p_user_id UUID,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT 
    p.id,
    p.item_id,
    p.s3_key,
    p.created_at,
    array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL) as tags
  FROM photos p
  LEFT JOIN tags t ON p.id = t.photo_id
  INNER JOIN items i ON p.item_id = i.id
  INNER JOIN categories c ON i.category_id = c.id
  WHERE p.home_id = p_home_id
    AND ((c.is_private = false) OR (c.created_by = p_user_id))
  GROUP BY p.id, p.item_id, p.s3_key, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;