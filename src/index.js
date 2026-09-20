require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');
const itemRoutes = require('./routes/items');
const categoryRoutes = require('./routes/categories');
const locationsRouter = require('./routes/locations');
const itemLocationsRouter = require('./routes/item-locations');
const searchRoutes = require('./routes/search');
   
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationsRouter);
app.use('/api/items/:id/locations', itemLocationsRouter);
app.use('/api/search', searchRoutes);

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
