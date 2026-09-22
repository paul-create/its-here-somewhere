CREATE OR REPLACE PROCEDURE sp_addUserToHome(
  p_home_code VARCHAR,
  p_user_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR,
  OUT p_home_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get home by code
  SELECT id INTO p_home_id FROM homes WHERE home_code = p_home_code;

  IF p_home_id IS NULL THEN
    p_success := FALSE;
    p_message := 'Invalid home code';
    RETURN;
  END IF;

  -- Check if user already has a home assigned
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND home_id IS NOT NULL) THEN
    p_success := FALSE;
    p_message := 'User is already assigned to a home';
    RETURN;
  END IF;

  -- Update user to add home_id
  UPDATE users SET home_id = p_home_id WHERE id = p_user_id;

  p_success := TRUE;
  p_message := 'User added to home successfully';
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;