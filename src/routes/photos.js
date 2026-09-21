const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { uploadPhotoToS3 } = require('../utils/s3');
const { tagPhoto } = require('../utils/claude');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/photos (upload photo, tag with Claude, store in DB)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    // itemId can come from query or body
    const itemId = req.query.itemId || req.body.itemId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File required' });
    }

    if (!itemId) {
      return res.status(400).json({ error: 'itemId required (as query param or in body)' });
    }

    // Verify item exists
    const itemCheck = await pool.query('SELECT id FROM items WHERE id = $1', [itemId]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Upload to S3
    const { s3Key, s3Url } = await uploadPhotoToS3(file, itemId);

    // Tag with Claude - convert buffer to base64
    const base64Image = file.buffer.toString('base64');
    const mediaType = file.mimetype || 'image/jpeg';
    const imageDataUrl = `data:${mediaType};base64,${base64Image}`;
    const tags = await tagPhoto(imageDataUrl, mediaType);

    // Store photo metadata
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
      message: 'Photo uploaded and tagged successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;