const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

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

    // Create the item_location record (link item to location)
    await pool.query(
      'INSERT INTO item_locations (item_id, location_id, moved_by, stored_at, created_at) VALUES ($1, $2, $3, NOW(), NOW())',
      [item.id, location_id, req.user.id]
    );

    // Return item with location_id included
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
      LEFT JOIN item_locations il ON i.id = il.item_id
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
      'SELECT i.*, il.location_id FROM items i JOIN categories c ON i.category_id = c.id LEFT JOIN item_locations il ON i.id = il.item_id WHERE i.id = $1 AND ((c.is_private = false) OR (c.created_by = $2))',
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

    // Check ownership
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND created_by = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted', item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;