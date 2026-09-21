CREATE OR REPLACE PROCEDURE sp_addUserToHome(
  p_home_code VARCHAR,
  p_email VARCHAR,
  p_cognito_user_id VARCHAR,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_home_id UUID;
BEGIN
  -- Get home by code
  SELECT id INTO v_home_id FROM homes WHERE home_code = p_home_code;

  IF v_home_id IS NULL THEN
    p_success := FALSE;
    p_message := 'Invalid home code';
    RETURN;
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE home_id = v_home_id AND email = p_email) THEN
    p_success := FALSE;
    p_message := 'User already exists in this home';
    RETURN;
  END IF;

  -- Add user to home
  INSERT INTO users (home_id, email, cognito_user_id)
  VALUES (v_home_id, p_email, p_cognito_user_id);

  p_success := TRUE;
  p_message := 'User added to home successfully';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;