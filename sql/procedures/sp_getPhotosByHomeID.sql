CREATE OR REPLACE PROCEDURE sp_getPhotosByHomeID(
  p_home_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT 
    p.id,
    p.item_id,
    p.s3_key,
    p.uploaded_by,
    p.created_at,
    array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL) as tags
  FROM photos p
  LEFT JOIN tags t ON p.id = t.photo_id
  WHERE p.home_id = p_home_id
  GROUP BY p.id, p.item_id, p.s3_key, p.uploaded_by, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;