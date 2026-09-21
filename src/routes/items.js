const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper: Get category name
async function getCategoryName(categoryId) {
  const result = await pool.query('SELECT name FROM categories WHERE id = $1', [categoryId]);
  return result.rows[0]?.name || 'Unknown';
}

// Helper: Get location name
async function getLocationName(locationId) {
  const result = await pool.query('SELECT name FROM locations WHERE id = $1', [locationId]);
  return result.rows[0]?.name || 'Unknown';
}

// Helper: Log activity
async function logActivity(itemId, userId, property, oldValue, newValue) {
  await pool.query(
    'INSERT INTO activity_log (item_id, changed_by, property, old_value, new_value, changed_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [itemId, userId, property, oldValue, newValue]
  );
}

// POST /api/items (create)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, quantity, category_id, location_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    if (!location_id) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    // Create the item
    const itemResult = await pool.query(
      'INSERT INTO items (category_id, name, description, quantity, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [category_id, name, description || null, quantity || 1, req.user.id]
    );

    const item = itemResult.rows[0];

    // Create the item_location record
    await pool.query(
      'INSERT INTO item_locations (item_id, location_id, moved_by, stored_at, created_at) VALUES ($1, $2, $3, NOW(), NOW())',
      [item.id, location_id, req.user.id]
    );

    // Log activity - Category
    const categoryName = await getCategoryName(category_id);
    await logActivity(item.id, req.user.id, 'Category', null, categoryName);

    // Log activity - Location
    const locationName = await getLocationName(location_id);
    await logActivity(item.id, req.user.id, 'Location', null, locationName);

    res.status(201).json({
      ...item,
      location_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items (list - only items in public categories or your categories)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category_id } = req.query;

    let query = `
      SELECT i.*, il.location_id 
      FROM items i
      JOIN categories c ON i.category_id = c.id
      LEFT JOIN LATERAL (
        SELECT location_id FROM item_locations 
        WHERE item_id = i.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) il ON true
      WHERE (c.is_private = false) OR (c.created_by = $1)
    `;
    const params = [req.user.id];

    if (category_id) {
      query += ` AND i.category_id = $${params.length + 1}`;
      params.push(category_id);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id (get one)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, il.location_id 
       FROM items i 
       JOIN categories c ON i.category_id = c.id 
       LEFT JOIN LATERAL (
         SELECT location_id FROM item_locations 
         WHERE item_id = i.id 
         ORDER BY created_at DESC 
         LIMIT 1
       ) il ON true
       WHERE i.id = $1 AND ((c.is_private = false) OR (c.created_by = $2))`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id (update)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, category_id } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = checkResult.rows[0];

    // Log category change if it happened
    if (category_id !== undefined && category_id !== item.category_id) {
      const oldCategoryName = await getCategoryName(item.category_id);
      const newCategoryName = await getCategoryName(category_id);
      await logActivity(id, req.user.id, 'Category', oldCategoryName, newCategoryName);
    }

    const updateResult = await pool.query(
      'UPDATE items SET name = $1, description = $2, quantity = $3, category_id = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [
        name !== undefined ? name : item.name,
        description !== undefined ? description : item.description,
        quantity !== undefined ? quantity : item.quantity,
        category_id !== undefined ? category_id : item.category_id,
        id
      ]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id (delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership first
    const checkResult = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = checkResult.rows[0];

    // Delete in FK-safe order
    // 1. Delete tags (references photos)
    await pool.query(
      'DELETE FROM tags WHERE photo_id IN (SELECT id FROM photos WHERE item_id = $1)',
      [id]
    );

    // 2. Delete photos (references items)
    await pool.query('DELETE FROM photos WHERE item_id = $1', [id]);

    // 3. Delete item_locations (references items)
    await pool.query('DELETE FROM item_locations WHERE item_id = $1', [id]);

    // 4. Delete activity_log (references items)
    await pool.query('DELETE FROM activity_log WHERE item_id = $1', [id]);

    // 5. Finally delete the item
    const deleteResult = await pool.query(
      'DELETE FROM items WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({ message: 'Item deleted', item: deleteResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id/location (move item to new location)
router.put('/:id/location', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id } = req.body;

    if (!location_id) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    // Check ownership
    const checkResult = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get old location
    const oldLocationResult = await pool.query(
      'SELECT location_id FROM item_locations WHERE item_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    const oldLocationId = oldLocationResult.rows[0]?.location_id;
    const oldLocationName = oldLocationId ? await getLocationName(oldLocationId) : 'None';
    const newLocationName = await getLocationName(location_id);

    // Create new item_location record
    await pool.query(
      'INSERT INTO item_locations (item_id, location_id, moved_by, stored_at, created_at) VALUES ($1, $2, $3, NOW(), NOW())',
      [id, location_id, req.user.id]
    );

    // Log activity
    await logActivity(id, req.user.id, 'Location', oldLocationName, newLocationName);

    const item = await pool.query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );

    res.json({
      ...item.rows[0],
      location_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id/activity (get activity history)
router.get('/:id/activity', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT created_by FROM items WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get activity log for this item
    const result = await pool.query(
      `SELECT 
        id,
        property,
        old_value,
        new_value,
        changed_at,
        (SELECT email FROM users WHERE id = changed_by) as changed_by_email
      FROM activity_log 
      WHERE item_id = $1 
      ORDER BY changed_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;