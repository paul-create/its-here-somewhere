const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/locations
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, parent_location_id, is_private } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    // If parent_location_id provided, verify it exists
    if (parent_location_id) {
      const parentCheck = await pool.query(
        'SELECT id FROM locations WHERE id = $1',
        [parent_location_id]
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent location not found' });
      }
    }

    // Circular reference check
    if (parent_location_id === 'same-id') {
      return res.status(400).json({ error: 'Cannot be own parent' });
    }

    const result = await pool.query(
      'INSERT INTO locations (name, parent_location_id, created_by, is_private) VALUES ($1, $2, $3, $4) RETURNING id, name, parent_location_id, created_by, is_private, created_at',
      [name.trim(), parent_location_id || null, req.user.id, is_private || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, parent_location_id, created_by, is_private, created_at
      FROM locations
      WHERE (is_private = false) OR (created_by = $1)
      ORDER BY name
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/locations/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, parent_location_id, is_private } = req.body;
  const { id } = req.params;
  
  try {
    // Check ownership/privacy
    const check = await pool.query(
      'SELECT created_by, is_private FROM locations WHERE id = $1',
      [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const location = check.rows[0];
    if (location.is_private && location.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    
    // Circular reference check
    if (parent_location_id === id) {
      return res.status(400).json({ error: 'Cannot be own parent' });
    }
    
    const result = await pool.query(
      'UPDATE locations SET name = $1, parent_location_id = $2, is_private = $3 WHERE id = $4 RETURNING *',
      [name || location.name, parent_location_id || null, is_private !== undefined ? is_private : location.is_private, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/locations/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check ownership/privacy
    const check = await pool.query(
      'SELECT created_by, is_private FROM locations WHERE id = $1',
      [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const location = check.rows[0];
    if (location.is_private && location.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    
    // Check if location has items
    const itemCheck = await pool.query(
      'SELECT COUNT(*) as count FROM item_locations WHERE location_id = $1',
      [id]
    );
    if (itemCheck.rows[0].count > 0) {
      return res.status(400).json({ error: 'Location has items, cannot delete' });
    }
    
    await pool.query('DELETE FROM locations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;