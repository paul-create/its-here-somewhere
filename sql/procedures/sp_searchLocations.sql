CREATE OR REPLACE PROCEDURE sp_searchLocations(
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
    parent_location_id,
    is_private,
    created_by,
    created_at
  FROM locations
  WHERE home_id = p_home_id
    AND name ILIKE ('%' || p_query || '%')
    AND ((is_private = false) OR (created_by = p_user_id))
  ORDER BY created_at DESC
  LIMIT 50;
END;
$$;