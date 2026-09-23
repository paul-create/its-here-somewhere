const jwt = require('jsonwebtoken');
const pool = require('../db');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode token without verification (fine for MVP, not production)
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Look up user and home via stored procedure
    const result = await pool.query(
      'CALL sp_getUserWithHome($1::varchar, NULL::uuid, NULL::uuid)',
      [decoded.sub]
    );

    if (!result.rows[0].p_user_id) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      ...decoded,
      sub: decoded.sub,
      id: result.rows[0].p_user_id,
      home_id: result.rows[0].p_home_id
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireHome = (req, res, next) => {
  if (!req.user?.home_id) {
    return res.status(403).json({ error: 'No home set up', code: 'NO_HOME' });
  }
  next();
};

module.exports = authMiddleware;
module.exports.requireHome = requireHome;