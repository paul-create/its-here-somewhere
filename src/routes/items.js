const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/items (create)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, quantity, category_id, is_private } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const itemId = randomUUID();
    const result = await pool.query(
      'INSERT INTO items (id, user_id, name, description, quantity, category_id, is_private, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *',
      [itemId, userId, name, description || null, quantity || 1, category_id || null, is_private || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items (list with filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category_id, is_private } = req.query;
    const userId = req.user.id;

    let query = 'SELECT * FROM items WHERE user_id = $1';
    const params = [userId];

    if (category_id) {
      query += ` AND category_id = $${params.length + 1}`;
      params.push(category_id);
    }

    if (is_private !== undefined) {
      query += ` AND is_private = $${params.length + 1}`;
      params.push(is_private === 'true');
    }

    query += ' ORDER BY created_at DESC';

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
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [id, userId]
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
    const userId = req.user.id;
    const { name, description, quantity, category_id, is_private } = req.body;

    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = result.rows[0];
    const updateResult = await pool.query(
      'UPDATE items SET name = $1, description = $2, quantity = $3, category_id = $4, is_private = $5, updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *',
      [
        name !== undefined ? name : item.name,
        description !== undefined ? description : item.description,
        quantity !== undefined ? quantity : item.quantity,
        category_id !== undefined ? category_id : item.category_id,
        is_private !== undefined ? is_private : item.is_private,
        id,
        userId
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
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
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
