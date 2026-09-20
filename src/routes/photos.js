const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { uploadPhotoToS3 } = require('../utils/s3');
const { tagPhoto } = require('../utils/claude');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/photos (upload photo and tag it)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { itemId } = req.query;
    const file = req.file;

    if (!file || !itemId) {
      return res.status(400).json({ error: 'File and itemId required' });
    }

    // Upload to S3
    const { s3Key, s3Url } = await uploadPhotoToS3(file, itemId);

    // Tag with Claude
    const tags = await tagPhoto(s3Url);

    // Store photo metadata in PostgreSQL
    const photoId = randomUUID();
    await pool.query(
      'INSERT INTO photos (id, item_id, s3_key, uploaded_by, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [photoId, itemId, s3Key, req.user.id]
    );

    // Store auto-generated tags
    for (const tagName of tags) {
      await pool.query(
        'INSERT INTO tags (photo_id, tag_name, is_auto_generated) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
        [photoId, tagName.toLowerCase()]
      );
    }

    res.status(201).json({ 
      photoId, 
      s3Url, 
      tags,
      message: 'Photo uploaded and tagged' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;