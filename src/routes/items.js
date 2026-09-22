const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireHome } = require('../middleware/auth');
const { callReadProc, callWriteProc } = require('../utils/procedures');
const { isUuid, sendProcError } = require('../utils/routeHelpers');
const { getSignedPhotoUrl } = require('../utils/s3');

const router = express.Router();

const VISIBILITY = { all: null, public: false, private: true };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// undefined / null / '' -> null (not supplied), whole number >= 0 -> number, anything else -> NaN
function parseQuantity(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

// Swap the private S3 key for a short-lived signed URL
async function withPhotoUrl({ photo_s3_key, ...item }) {
  let photo_url = null;
  if (photo_s3_key) {
    try {
      photo_url = await getSignedPhotoUrl(photo_s3_key);
    } catch (e) {
      console.error('Failed to sign photo URL:', e.message);
    }
  }
  return { ...item, photo_url };
}

// Single item the current user is allowed to see, or null
async function getVisibleItem(req, itemId) {
  const rows = await callReadProc('sp_getItemByID', [itemId, req.user.home_id, req.user.id]);
  return rows.length ? withPhotoUrl(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// POST /api/items (create)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const { name, description, category_id, location_id } = req.body;
    const quantity = parseQuantity(req.body.quantity);

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (name.trim().length > 255) {
      return res.status(400).json({ error: 'Name must be 255 characters or fewer' });
    }
    if (!isUuid(category_id)) {
      return res.status(400).json({ error: 'A valid category_id is required' });
    }
    if (!isUuid(location_id)) {
      return res.status(400).json({ error: 'A valid location_id is required' });
    }
    if (Number.isNaN(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a whole number of 0 or more' });
    }

    const result = await callWriteProc('sp_createItem', [
      req.user.home_id,
      category_id,
      name.trim(),
      typeof description === 'string' ? description.trim() || null : null,
      quantity,
      location_id,
      req.user.id
    ], 3);

    if (result.p_error_code) return sendProcError(res, result);

    const item = await getVisibleItem(req, result.p_item_id);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/items?page=1&pageSize=5&visibility=public&category_id=...
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const { category_id } = req.query;
    const visibility = req.query.visibility || 'all';
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 5, 1), 50);

    if (!(visibility in VISIBILITY)) {
      return res.status(400).json({ error: 'visibility must be all, public or private' });
    }
    if (category_id && !isUuid(category_id)) {
      return res.status(400).json({ error: 'Invalid category_id' });
    }

    const rows = await callReadProc('sp_getAllItems', [
      req.user.home_id,
      req.user.id,
      category_id || null,
      VISIBILITY[visibility],
      pageSize,
      (page - 1) * pageSize
    ]);

    const total = rows.length ? Number(rows[0].total_count) : 0;
    const items = await Promise.all(
      rows.map(({ total_count, ...item }) => withPhotoUrl(item))
    );

    res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/items/:id (get one)
// ---------------------------------------------------------------------------
router.get('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const item = await getVisibleItem(req, id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/items/:id (update - creator only)
// ---------------------------------------------------------------------------
router.put('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id } = req.body;
    const quantity = parseQuantity(req.body.quantity);

    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    if (typeof name === 'string' && name.trim().length > 255) {
      return res.status(400).json({ error: 'Name must be 255 characters or fewer' });
    }
    if (category_id !== undefined && !isUuid(category_id)) {
      return res.status(400).json({ error: 'Invalid category_id' });
    }
    if (Number.isNaN(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a whole number of 0 or more' });
    }

    const result = await callWriteProc('sp_updateItem', [
      id,
      req.user.home_id,
      req.user.id,
      typeof name === 'string' ? name.trim() : null,
      typeof description === 'string' ? description.trim() : null,
      quantity,
      category_id || null
    ]);

    if (result.p_error_code) return sendProcError(res, result);

    const item = await getVisibleItem(req, id);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/items/:id (soft delete - creator only)
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const result = await callWriteProc('sp_softDeleteItem', [id, req.user.home_id, req.user.id]);

    if (result.p_error_code) return sendProcError(res, result);

    res.json({ message: result.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/items/:id/location (move - anyone who can see the item)
// ---------------------------------------------------------------------------
router.put('/:id/location', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id } = req.body;

    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }
    if (!isUuid(location_id)) {
      return res.status(400).json({ error: 'A valid location_id is required' });
    }

    const result = await callWriteProc('sp_moveItemLocation', [
      id,
      req.user.home_id,
      location_id,
      req.user.id
    ]);

    if (result.p_error_code) return sendProcError(res, result);

    const item = await getVisibleItem(req, id);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to move item' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/items/:id/activity (activity history)
// ---------------------------------------------------------------------------
router.get('/:id/activity', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    // Visibility check first, so private items' history stays private
    const found = await callReadProc('sp_getItemByID', [id, req.user.home_id, req.user.id]);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const rows = await callReadProc('sp_getActivityLog', [id, req.user.home_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;