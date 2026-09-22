const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireHome } = require('../middleware/auth');
const { callReadProc, callWriteProc } = require('../utils/procedures');
const { isUuid, sendProcError } = require('../utils/routeHelpers');

const router = express.Router();

const MAX_NAME_LENGTH = 100; // matches categories.name VARCHAR(100)

// Single category the current user is allowed to see, or null
async function getVisibleCategory(req, categoryId) {
  const rows = await callReadProc('sp_getCategoryByID', [categoryId, req.user.home_id, req.user.id]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------------
// GET /api/categories (all visible categories, A-Z - small list, used by pickers)
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const rows = await callReadProc('sp_getAllCategories', [req.user.home_id, req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/categories (create - privacy is set here and can't change later)
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const { name, is_private } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Category name must be ${MAX_NAME_LENGTH} characters or fewer` });
    }
    if (is_private !== undefined && typeof is_private !== 'boolean') {
      return res.status(400).json({ error: 'is_private must be true or false' });
    }

    const result = await callWriteProc('sp_createCategory', [
      req.user.home_id,
      name.trim(),
      is_private === true,
      req.user.id
    ], 3);

    if (result.p_error_code) return sendProcError(res, result);

    const category = await getVisibleCategory(req, result.p_category_id);
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/categories/:id (rename - creator only; privacy is fixed at creation)
// ---------------------------------------------------------------------------
router.put('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_private } = req.body;

    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid category id' });
    }
    if (is_private !== undefined) {
      return res.status(400).json({
        error: 'Privacy can\'t be changed after a category is created. Create a new category instead.'
      });
    }
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Category name must be ${MAX_NAME_LENGTH} characters or fewer` });
    }

    const result = await callWriteProc('sp_updateCategory', [
      id,
      req.user.home_id,
      req.user.id,
      name.trim()
    ]);

    if (result.p_error_code) return sendProcError(res, result);

    const category = await getVisibleCategory(req, id);
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/categories/:id (soft delete - creator only, must be unused)
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, requireHome, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid category id' });
    }

    const result = await callWriteProc('sp_softDeleteCategory', [id, req.user.home_id, req.user.id]);

    if (result.p_error_code) return sendProcError(res, result);

    res.json({ message: result.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;