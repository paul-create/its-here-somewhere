const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { createCognitoUser, loginUser } = require('../utils/cognito');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Create user in Cognito
    const cognitoUserId = await createCognitoUser(email, password);

    // Create user in PostgreSQL (home_id starts as NULL)
    const userId = randomUUID();
    await pool.query(
      'INSERT INTO users (id, email, cognito_user_id, home_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, email, cognitoUserId, null]
    );

    res.status(201).json({ 
      message: 'User created', 
      userId,
      homeId: null  // User hasn't created/joined a home yet
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get token from Cognito
    const token = await loginUser(email, password);

    // Get user from PostgreSQL (including home_id)
    const result = await pool.query('SELECT id, home_id FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ 
      token, 
      userId: user.id,
      homeId: user.home_id  // null if user hasn't created/joined a home yet
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
});

// GET /api/auth/me (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE cognito_user_id = $1', [req.user.sub]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/create-home (create a new home for the current user)
// Body: { name }
// User must exist but not yet be assigned to a home
// ---------------------------------------------------------------------------
router.post('/create-home', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Home name is required' });
    }
    if (name.trim().length > 255) {
      return res.status(400).json({ error: 'Home name must be 255 characters or fewer' });
    }

    // Check if user already has a home
    const userCheck = await pool.query('SELECT home_id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userCheck.rows[0].home_id !== null) {
      return res.status(400).json({ error: 'User already belongs to a home' });
    }

    // Generate a unique home code
    const homeCode = randomUUID().substring(0, 8).toUpperCase();

    // Create home via stored procedure
    const result = await pool.query(
      'CALL sp_createHome($1::varchar, $2::varchar, $3::uuid)',
      [name.trim(), homeCode, userId]
    );

    const procResult = result.rows[0];

    // Update user's home_id
    await pool.query('UPDATE users SET home_id = $1 WHERE id = $2', [procResult.p_home_id, userId]);

    res.status(201).json({
      home_id: procResult.p_home_id,
      home_code: procResult.p_home_code_out,
      message: 'Home created successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create home' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/join-home (join an existing home with a code)
// Body: { home_code }
// User must exist but not yet be assigned to a home
// ---------------------------------------------------------------------------
router.post('/join-home', authMiddleware, async (req, res) => {
  try {
    const { home_code } = req.body;
    const userId = req.user.id;

    if (typeof home_code !== 'string' || !home_code.trim()) {
      return res.status(400).json({ error: 'Home code is required' });
    }

    // Check if user already has a home
    const userCheck = await pool.query('SELECT home_id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userCheck.rows[0].home_id !== null) {
      return res.status(400).json({ error: 'User already belongs to a home' });
    }

    // Join home via stored procedure
    const result = await pool.query(
      'CALL sp_addUserToHome($1::varchar, $2::uuid)',
      [home_code.trim(), userId]
    );

    const procResult = result.rows[0];

    if (!procResult.p_success) {
      return res.status(400).json({ error: procResult.p_message });
    }

    res.json({
      home_id: procResult.p_home_id,
      message: procResult.p_message
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join home' });
  }
});

module.exports = router;