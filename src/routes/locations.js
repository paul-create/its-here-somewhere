const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { requireHome } = require('../middleware/auth');
const { isUuid, sendProcError } = require('../utils/routeHelpers');

const router = express.Router();

const MAX_NAME_LENGTH = 255; // matches locations.name VARCHAR(255)

// Single location the current user is allowed to see, or null
async function getVisibleLocation(req, locationId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'CALL sp_getLocationByID($1::uuid, $2::uuid, $3::uuid)',
      [locationId, req.user.home_id, req.user.id]
    );
    const result = await client.query('FETCH ALL FROM result');
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// GET /api/locations (all visible locations, A-Z - small list, used by pickers)
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, requireHome, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'CALL sp_getAllLocations($1::uuid, $2::uuid)',
      [req.user.home_id, req.user.id]
    );
    const result = await client.query('FETCH ALL FROM result');
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/locations (create - privacy is set here and can't change later)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const { name, parent_location_id, is_private } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Location name is required' });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Location name must be ${MAX_NAME_LENGTH} characters or fewer` });
    }
    if (parent_location_id !== undefined && parent_location_id !== null && !isUuid(parent_location_id)) {
      return res.status(400).json({ error: 'Invalid parent_location_id' });
    }
    if (is_private !== undefined && typeof is_private !== 'boolean') {
      return res.status(400).json({ error: 'is_private must be true or false' });
    }

    const result = await pool.query(
      'CALL sp_createLocation($1::uuid, $2::varchar, $3::uuid, $4::boolean, $5::uuid)',
      [
        req.user.home_id,
        name.trim(),
        parent_location_id || null,
        is_private === true,
        req.user.id
      ]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

    const location = await getVisibleLocation(req, procResult.p_location_id);
    res.status(201).json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/locations/:id (rename and/or change parent - creator only)
//   parent_location_id: omitted = unchanged, null = top level, id = new parent
// ---------------------------------------------------------------------------
router.put('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_location_id, is_private } = req.body;
    const updateParent = parent_location_id !== undefined;

    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid location id' });
    }
    if (is_private !== undefined) {
      return res.status(400).json({
        error: 'Privacy can\'t be changed after a location is created. Create a new location instead.'
      });
    }
    if (name === undefined && !updateParent) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'Location name cannot be empty' });
    }
    if (typeof name === 'string' && name.trim().length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Location name must be ${MAX_NAME_LENGTH} characters or fewer` });
    }
    if (updateParent && parent_location_id !== null && !isUuid(parent_location_id)) {
      return res.status(400).json({ error: 'Invalid parent_location_id' });
    }

    const result = await pool.query(
      'CALL sp_updateLocation($1::uuid, $2::uuid, $3::uuid, $4::varchar, $5::boolean, $6::uuid)',
      [
        id,
        req.user.home_id,
        req.user.id,
        name ? name.trim() : null,
        updateParent,
        updateParent ? parent_location_id : null
      ]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

    const location = await getVisibleLocation(req, id);
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/locations/:id (soft delete - creator only, must be unused)
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid location id' });
    }

    const result = await pool.query(
      'CALL sp_softDeleteLocation($1::uuid, $2::uuid, $3::uuid)',
      [id, req.user.home_id, req.user.id]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

    res.json({ message: procResult.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

module.exports = router;