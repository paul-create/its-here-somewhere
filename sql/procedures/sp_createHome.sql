CREATE OR REPLACE PROCEDURE sp_createHome(
  p_home_name VARCHAR,
  p_home_code VARCHAR,
  p_created_by_user_id UUID,
  OUT p_home_id UUID,
  OUT p_home_code_out VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create home
  INSERT INTO homes (name, home_code, created_by)
  VALUES (p_home_name, p_home_code, p_created_by_user_id)
  RETURNING id, home_code INTO p_home_id, p_home_code_out;
END;
$$;