CREATE OR REPLACE PROCEDURE sp_createHome(
  p_home_name VARCHAR,
  p_home_code VARCHAR,
  p_user_id UUID,
  p_email VARCHAR,
  p_cognito_user_id VARCHAR,
  OUT p_home_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create home
  INSERT INTO homes (name, home_code, created_by)
  VALUES (p_home_name, p_home_code, p_user_id)
  RETURNING id INTO p_home_id;

  -- Add user to home
  INSERT INTO users (home_id, email, cognito_user_id)
  VALUES (p_home_id, p_email, p_cognito_user_id);

  COMMIT;
END;
$$;