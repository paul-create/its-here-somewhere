const express = require('express');
const pool = require('../db');
const { requireHome } = require('../middleware/auth');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Search items by name, description, tags
router.get('/items', authMiddleware, requireHome, async (req, res) => {
  const client = await pool.connect();
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    await client.query('BEGIN');
    const callResult = await client.query(
      'CALL sp_searchItems($1::uuid, $2::uuid, $3::varchar, NULL::refcursor)',
      [req.user.home_id, req.user.id, q.trim()]
    );
    const cursorName = callResult.rows[0].result;
    const result = await client.query(`FETCH ALL FROM "${cursorName}"`);
    await client.query('COMMIT');

    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Search items error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Search categories by name
router.get('/categories', authMiddleware, requireHome, async (req, res) => {
  const client = await pool.connect();
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    await client.query('BEGIN');
    const callResult = await client.query(
      'CALL sp_searchCategories($1::uuid, $2::uuid, $3::varchar, NULL::refcursor)',
      [req.user.home_id, req.user.id, q.trim()]
    );
    const cursorName = callResult.rows[0].result;
    const result = await client.query(`FETCH ALL FROM "${cursorName}"`);
    await client.query('COMMIT');

    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Search categories error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Search locations by name
router.get('/locations', authMiddleware, requireHome, async (req, res) => {
  const client = await pool.connect();
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    await client.query('BEGIN');
    const callResult = await client.query(
      'CALL sp_searchLocations($1::uuid, $2::uuid, $3::varchar, NULL::refcursor)',
      [req.user.home_id, req.user.id, q.trim()]
    );
    const cursorName = callResult.rows[0].result;
    const result = await client.query(`FETCH ALL FROM "${cursorName}"`);
    await client.query('COMMIT');

    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Search locations error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;