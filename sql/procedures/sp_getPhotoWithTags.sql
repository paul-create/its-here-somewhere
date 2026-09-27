CREATE OR REPLACE PROCEDURE sp_getPhotoWithTags(
  p_photo_id UUID,
  p_home_id UUID,
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
    array_agg(
      json_build_object(
        'id', t.id,
        'tag_name', t.tag_name,
        'is_auto_generated', t.is_auto_generated
      ) ORDER BY t.created_at
    ) FILTER (WHERE t.id IS NOT NULL) as tags
  FROM photos p
  LEFT JOIN tags t ON p.id = t.photo_id
  WHERE p.id = p_photo_id AND p.home_id = p_home_id
  GROUP BY p.id, p.item_id, p.s3_key, p.created_at;
END;
$$;