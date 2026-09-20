const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/categories (list all categories for authenticated user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, user_id, name, created_at FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await pool.query(
      'INSERT INTO categories (id, user_id, name, created_at) VALUES (gen_random_uuid(), $1, $2, NOW()) RETURNING id, user_id, name, created_at',
      [userId, name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;
    const { name } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check the category belongs to this user (security)
    const checkResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update it
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, user_id, name, created_at',
      [name.trim(), categoryId, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;

    // Check category exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if any items use this category
    const itemsResult = await pool.query(
      'SELECT COUNT(*) as count FROM items WHERE category_id = $1',
      [categoryId]
    );

    if (itemsResult.rows[0].count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category - ${itemsResult.rows[0].count} item(s) still use it` 
      });
    }

    // Delete it
    await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
