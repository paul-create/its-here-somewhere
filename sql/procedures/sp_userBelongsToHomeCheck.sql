CREATE OR REPLACE PROCEDURE sp_userBelongsToHomeCheck(
  p_user_id UUID,
  OUT p_belongs BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT EXISTS(SELECT 1 FROM user_homes WHERE user_id = p_user_id) INTO p_belongs;
END;
$$;