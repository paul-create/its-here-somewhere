const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Search items by name, description, tags
router.get('/items', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const query = q.trim();
    const userId = req.user.id;

    // Search items by name, description, and tags
    // Must be in public category OR creator is current user
    const result = await pool.query(`
      SELECT DISTINCT
        i.id,
        i.name,
        i.description,
        i.quantity,
        i.created_by,
        c.id as category_id,
        c.name as category_name,
        c.is_private as category_is_private,
        i.created_at
      FROM items i
      JOIN categories c ON i.category_id = c.id
      LEFT JOIN tags t ON EXISTS (
        SELECT 1 FROM photos p 
        WHERE p.item_id = i.id 
        AND t.photo_id = p.id
      )
      WHERE (
        i.name ILIKE $1
        OR i.description ILIKE $1
        OR t.tag_name ILIKE $1
      )
      AND (
        (c.is_private = false)
        OR (c.created_by = $2)
      )
      ORDER BY i.created_at DESC
      LIMIT 50
    `, [`%${query}%`, userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Search items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search categories by name
router.get('/categories', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const query = q.trim();
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT
        id,
        name,
        is_private,
        created_by,
        created_at
      FROM categories
      WHERE name ILIKE $1
      AND (
        (is_private = false)
        OR (created_by = $2)
      )
      ORDER BY created_at DESC
      LIMIT 50
    `, [`%${query}%`, userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Search categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search locations by name
router.get('/locations', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const query = q.trim();
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT
        id,
        name,
        parent_location_id,
        is_private,
        created_by,
        created_at
      FROM locations
      WHERE name ILIKE $1
      AND (
        (is_private = false)
        OR (created_by = $2)
      )
      ORDER BY created_at DESC
      LIMIT 50
    `, [`%${query}%`, userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Search locations error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;