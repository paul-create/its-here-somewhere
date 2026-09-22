CREATE OR REPLACE FUNCTION fn_audit_items()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value, created_at)
      VALUES (NEW.home_id, NEW.id, NEW.created_by, NOW(), 'Name', OLD.name, NEW.name, NOW());
    END IF;

    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO activity_log (home_id, item_id, changed_by, changed_at, property, old_value, new_value, created_at)
      VALUES (NEW.home_id, NEW.id, NEW.created_by, NOW(), 'Description', OLD.description, NEW.description, NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_audit_items ON items;
CREATE TRIGGER tr_audit_items
AFTER UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION fn_audit_items();