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

    // Create user in PostgreSQL
    const userId = randomUUID();
    await pool.query(
      'INSERT INTO users (id, email, cognito_user_id, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, email, cognitoUserId]
    );

    res.status(201).json({ message: 'User created', userId });
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

    // Get user from PostgreSQL
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const userId = result.rows[0]?.id;

    res.json({ token, userId });
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

module.exports = router;