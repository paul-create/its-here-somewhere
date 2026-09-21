CREATE OR REPLACE PROCEDURE sp_getActivityLog(
  p_item_id UUID,
  p_home_id UUID,
  OUT result REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN result FOR
  SELECT 
    id,
    property,
    old_value,
    new_value,
    changed_at,
    (SELECT email FROM users WHERE id = changed_by) as changed_by_email
  FROM activity_log
  WHERE item_id = p_item_id AND home_id = p_home_id
  ORDER BY changed_at DESC;
END;
$$;