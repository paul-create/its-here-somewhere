CREATE OR REPLACE PROCEDURE sp_getUserWithHome(
  p_cognito_user_id VARCHAR,
  OUT p_user_id UUID,
  OUT p_home_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT u.id, uh.home_id 
  INTO p_user_id, p_home_id
  FROM users u 
  LEFT JOIN user_homes uh ON u.id = uh.user_id 
  WHERE u.cognito_user_id = p_cognito_user_id;
END;
$$;