const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { uploadPhotoToS3 } = require('../utils/s3');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/photos (upload photo)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { itemId } = req.query;
    const file = req.file;

    if (!file || !itemId) {
      return res.status(400).json({ error: 'File and itemId required' });
    }

    // Upload to S3
    const { s3Key, s3Url } = await uploadPhotoToS3(file, itemId);

    // Store photo metadata in PostgreSQL
    const photoId = randomUUID();
    // TODO: Uncomment once items endpoint exists
    // await pool.query(
    //   'INSERT INTO photos (id, item_id, s3_key, uploaded_by, created_at) VALUES ($1, $2, $3, $4, NOW())',
    //   [photoId, itemId, s3Key, req.user.sub]
    // );

    // TODO: Call Claude API for auto-tagging
    // For now, just return the photo info

    res.status(201).json({ photoId, s3Url, message: 'Photo uploaded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;