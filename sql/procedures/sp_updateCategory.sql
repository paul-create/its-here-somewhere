CREATE OR REPLACE PROCEDURE sp_updateCategory(
  p_category_id UUID,
  p_home_id UUID,
  p_user_id UUID,
  p_name VARCHAR DEFAULT NULL,
  p_is_private BOOLEAN DEFAULT NULL,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_category categories;
BEGIN
  -- Check ownership
  SELECT * INTO v_category FROM categories WHERE id = p_category_id AND home_id = p_home_id AND created_by = p_user_id;
  
  IF v_category IS NULL THEN
    p_success := FALSE;
    p_message := 'Category not found or not authorised';
    RETURN;
  END IF;

  UPDATE categories 
  SET 
    name = COALESCE(p_name, name),
    is_private = COALESCE(p_is_private, is_private),
    updated_at = NOW()
  WHERE id = p_category_id;

  p_success := TRUE;
  p_message := 'Category updated';
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  p_success := FALSE;
  p_message := SQLERRM;
END;
$$;