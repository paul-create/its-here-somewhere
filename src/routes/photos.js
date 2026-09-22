const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { requireHome } = require('../middleware/auth');
const { callReadProc, callWriteProc } = require('../utils/procedures');
const { isUuid } = require('../utils/routeHelpers');
const { uploadPhotoToS3 } = require('../utils/s3');
const { tagPhoto } = require('../utils/claude');
const { getSignedPhotoUrl } = require('../utils/s3');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/photos (upload photo, tag with Claude, store in DB)
router.post('/', authMiddleware, requireHome, upload.single('file'), async (req, res) => {
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
      tags,
      message: 'Photo uploaded and tagged successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/photos (retrieve all photos for user's items)
router.get('/', authMiddleware, requireHome, async (req, res) => {
  try {
    const rows = await callReadProc('sp_getAllPhotos', [req.user.home_id, req.user.id]);

    // Generate signed URLs for each photo
    const photos = await Promise.all(rows.map(async (row) => {
      const signedUrl = await getSignedPhotoUrl(row.s3_key, 3600);
      return {
        id: row.id,
        item_id: row.item_id,
        s3_key: row.s3_key,
        s3_url: signedUrl,
        tags: row.tags || [],
        created_at: row.created_at
      };
    }));

    res.json(photos);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// DELETE /api/photos/:photoId (delete a photo)
router.delete('/:photoId', authMiddleware, requireHome, async (req, res) => {
  try {
    const { photoId } = req.params;

    if (!isUuid(photoId)) {
      return res.status(400).json({ error: 'Invalid photo id' });
    }

    const result = await callWriteProc('sp_softDeletePhoto', [
      photoId,
      req.user.home_id,
      req.user.id
    ]);

    if (!result.p_success) {
      if (result.p_message === 'Photo not found') {
        return res.status(404).json({ error: result.p_message });
      }
      return res.status(403).json({ error: result.p_message });
    }

    // Note: We're not deleting from S3 to keep history, but in production you might want to

    res.json({ message: result.p_message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;