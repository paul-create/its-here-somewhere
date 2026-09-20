const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/items/:id/locations - record item moved to location
router.post('/', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { location_id } = req.body;
    const userId = req.user.id;

    if (!location_id) {
      return res.status(400).json({ error: 'Location ID required' });
    }

    // Verify item exists and user can access it
    const itemCheck = await pool.query(`
      SELECT i.id FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1 AND ((c.is_private = false) OR (c.created_by = $2))
    `, [itemId, userId]);

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify location exists and user can access it
    const locCheck = await pool.query(`
      SELECT id FROM locations
      WHERE id = $1 AND ((is_private = false) OR (created_by = $2))
    `, [location_id, userId]);

    if (locCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Record the move
    const result = await pool.query(`
      INSERT INTO item_locations (item_id, location_id, moved_by, stored_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, item_id, location_id, moved_by, stored_at
    `, [itemId, location_id, userId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id/history - get location history for item
router.get('/', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    // Verify item exists and user can access it
    const itemCheck = await pool.query(`
      SELECT i.id FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1 AND ((c.is_private = false) OR (c.created_by = $2))
    `, [itemId, userId]);

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get location history
    const result = await pool.query(`
      SELECT 
        il.id,
        il.item_id,
        il.location_id,
        l.name as location_name,
        il.moved_by,
        u.email as moved_by_email,
        il.stored_at
      FROM item_locations il
      JOIN locations l ON il.location_id = l.id
      JOIN users u ON il.moved_by = u.id
      WHERE il.item_id = $1
      ORDER BY il.stored_at DESC
    `, [itemId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;