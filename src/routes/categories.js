const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, created_by, is_private, created_at
      FROM categories
      WHERE (is_private = false) OR (created_by = $1)
      ORDER BY name
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, is_private } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, created_by, is_private) VALUES ($1, $2, $3) RETURNING id, name, created_by, is_private, created_at',
      [name.trim(), req.user.id, is_private || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_private } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check ownership
    const checkResult = await pool.query(
      'SELECT id, created_by FROM categories WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (checkResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    // Update it
    const result = await pool.query(
      'UPDATE categories SET name = $1, is_private = $2 WHERE id = $3 RETURNING id, name, created_by, is_private, created_at',
      [name.trim(), is_private !== undefined ? is_private : false, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT created_by FROM categories WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (checkResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    // Check if any items use this category
    const itemsResult = await pool.query(
      'SELECT COUNT(*) as count FROM items WHERE category_id = $1',
      [id]
    );

    if (itemsResult.rows[0].count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category - ${itemsResult.rows[0].count} item(s) still use it` 
      });
    }

    // Delete it
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;