CREATE OR REPLACE PROCEDURE sp_createCategory(
  p_home_id UUID,
  p_name VARCHAR,
  p_is_private BOOLEAN,
  p_user_id UUID,
  OUT p_category_id UUID,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO categories (home_id, name, created_by, is_private, created_at, updated_at)
  VALUES (p_home_id, p_name, p_user_id, COALESCE(p_is_private, FALSE), NOW(), NOW())
  RETURNING id INTO p_category_id;

  p_success := TRUE;
  p_message := 'Category created';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;