const express = require('express');
const pool = require('../db');
const { requireHome } = require('../middleware/auth');
const authMiddleware = require('../middleware/auth');
const { sendProcError } = require('../utils/routeHelpers');

const router = express.Router({ mergeParams: true });

// POST /api/items/:id/locations - record item moved to location
router.post('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { location_id } = req.body;

    if (!location_id) {
      return res.status(400).json({ error: 'Location ID required' });
    }

    // Use stored procedure to move item
    const result = await pool.query(
      'CALL sp_moveItemLocation($1::uuid, $2::uuid, $3::uuid, $4::uuid)',
      [itemId, req.user.home_id, location_id, req.user.id]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

    res.status(201).json({ message: procResult.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id/history - get activity log for item
router.get('/', authMiddleware, requireHome, async (req, res) => {
  const client = await pool.connect();
  try {
    const itemId = req.params.id;

    // Verify item exists and user can access it first
    await client.query('BEGIN');
    await client.query(
      'CALL sp_getItemByID($1::uuid, $2::uuid, $3::uuid)',
      [itemId, req.user.home_id, req.user.id]
    );
    let found = await client.query('FETCH ALL FROM result');
    if (found.rows.length === 0) {
      await client.query('COMMIT');
      client.release();
      return res.status(404).json({ error: 'Item not found' });
    }
    await client.query('COMMIT');

    // Get activity log
    await client.query('BEGIN');
    await client.query(
      'CALL sp_getActivityLog($1::uuid, $2::uuid)',
      [itemId, req.user.home_id]
    );
    const result = await client.query('FETCH ALL FROM result');
    await client.query('COMMIT');

    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;