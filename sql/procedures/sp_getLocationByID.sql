CREATE OR REPLACE PROCEDURE sp_getLocationByID(
  p_location_id UUID,
  p_home_id UUID,
  p_user_id UUID,
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
    created_by,
    COALESCE(is_private, false) AS is_private,
    created_at
  FROM locations
  WHERE id = p_location_id
    AND home_id = p_home_id
    AND (COALESCE(is_private, false) = false OR created_by = p_user_id);
END;
$$;