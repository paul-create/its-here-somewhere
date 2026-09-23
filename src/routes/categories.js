const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { requireHome } = require('../middleware/auth');
const { isUuid, sendProcError } = require('../utils/routeHelpers');

const router = express.Router();

const MAX_NAME_LENGTH = 100; // matches categories.name VARCHAR(100)

// Single category the current user is allowed to see, or null
async function getVisibleCategory(req, categoryId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'CALL sp_getCategoryByID($1::uuid, $2::uuid, $3::uuid)',
      [categoryId, req.user.home_id, req.user.id]
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
// GET /api/categories (all visible categories, A-Z - small list, used by pickers)
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, requireHome, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'CALL sp_getAllCategories($1::uuid, $2::uuid)',
      [req.user.home_id, req.user.id]
    );
    const result = await client.query('FETCH ALL FROM result');
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  } finally {
    client.release();
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

    const result = await pool.query(
      'CALL sp_createCategory($1::uuid, $2::varchar, $3::boolean, $4::uuid)',
      [
        req.user.home_id,
        name.trim(),
        is_private === true,
        req.user.id
      ]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

    const category = await getVisibleCategory(req, procResult.p_category_id);
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

    const result = await pool.query(
      'CALL sp_updateCategory($1::uuid, $2::uuid, $3::uuid, $4::varchar)',
      [id, req.user.home_id, req.user.id, name.trim()]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

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

    const result = await pool.query(
      'CALL sp_softDeleteCategory($1::uuid, $2::uuid, $3::uuid)',
      [id, req.user.home_id, req.user.id]
    );

    const procResult = result.rows[0];
    if (procResult.p_error_code) return sendProcError(res, procResult);

    res.json({ message: procResult.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;