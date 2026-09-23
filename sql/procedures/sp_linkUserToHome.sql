CREATE OR REPLACE PROCEDURE sp_linkUserToHome(
  p_user_id UUID,
  p_home_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_homes (id, user_id, home_id) VALUES (gen_random_uuid(), p_user_id, p_home_id);
  p_success := TRUE;
  p_message := 'User linked to home';
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;