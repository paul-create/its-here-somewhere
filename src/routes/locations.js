const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireHome } = require('../middleware/auth');
const { callReadProc, callWriteProc } = require('../utils/procedures');
const { isUuid, sendProcError } = require('../utils/routeHelpers');

const router = express.Router();

const MAX_NAME_LENGTH = 255; // matches locations.name VARCHAR(255)

// Single location the current user is allowed to see, or null
async function getVisibleLocation(req, locationId) {
  const rows = await callReadProc('sp_getLocationByID', [locationId, req.user.home_id, req.user.id]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------------
// GET /api/locations (all visible locations, A-Z - small list, used by pickers)
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const rows = await callReadProc('sp_getAllLocations', [req.user.home_id, req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch locations' });
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

    const result = await callWriteProc('sp_createLocation', [
      req.user.home_id,
      name.trim(),
      parent_location_id || null,
      is_private === true,
      req.user.id
    ], 3);

    if (result.p_error_code) return sendProcError(res, result);

    const location = await getVisibleLocation(req, result.p_location_id);
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

    const result = await callWriteProc('sp_updateLocation', [
      id,
      req.user.home_id,
      req.user.id,
      typeof name === 'string' ? name.trim() : null,
      updateParent,
      updateParent ? parent_location_id : null
    ]);

    if (result.p_error_code) return sendProcError(res, result);

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

    const result = await callWriteProc('sp_softDeleteLocation', [id, req.user.home_id, req.user.id]);

    if (result.p_error_code) return sendProcError(res, result);

    res.json({ message: result.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

module.exports = router;