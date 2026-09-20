require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

// Health check (no auth needed)
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Protected route example
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
