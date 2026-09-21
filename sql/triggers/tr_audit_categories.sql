CREATE OR REPLACE FUNCTION fn_audit_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name THEN
      INSERT INTO activity_log (home_id, changed_by, property, old_value, new_value)
      VALUES (NEW.home_id, NEW.created_by, 'Category', OLD.name, NEW.name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_audit_categories ON categories;
CREATE TRIGGER tr_audit_categories
AFTER UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION fn_audit_categories();