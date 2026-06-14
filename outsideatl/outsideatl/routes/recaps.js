/**
 * routes/recaps.js
 * ---------------------------------------------------------------
 * Past recap photos.
 *
 *   GET    /api/recaps      — public (homepage gallery reads this)
 *   POST   /api/recaps      — admin only (image REQUIRED)
 *   DELETE /api/recaps/:id  — admin only
 *
 * Image bytes go through services/storageService.js (local disk by
 * default; Supabase Storage when configured). Only the resulting public
 * URL is stored in SQLite.
 * ---------------------------------------------------------------
 */

const express = require('express');
const { db } = require('../database');
const requireAdmin = require('../middleware/requireAdmin');
const { uploadSingle } = require('../middleware/upload');
const storage = require('../services/storageService');
const airtable = require('../services/airtableService');
const { clean } = require('../validators');

const router = express.Router();

const LIMITS = { title: 120, caption: 280, event_label: 80 };

/** Validate the optional text fields. Returns { errors, data }. */
function validateRecapText(body) {
  const errors = {};
  const data = {
    title: clean(body.title),
    caption: clean(body.caption),
    event_label: clean(body.event_label),
  };
  if (data.title.length > LIMITS.title) errors.title = `Title is too long (max ${LIMITS.title}).`;
  if (data.caption.length > LIMITS.caption) errors.caption = `Caption is too long (max ${LIMITS.caption}).`;
  if (data.event_label.length > LIMITS.event_label) {
    errors.event_label = `Event label is too long (max ${LIMITS.event_label}).`;
  }
  return { errors, data };
}

function recapAirtableFields(recap) {
  return {
    Title: recap.title,
    Caption: recap.caption,
    'Event Label': recap.event_label,
    'Image URL': recap.image_url,
  };
}

// GET /api/recaps — public
router.get('/', (req, res) => {
  try {
    const recaps = db.prepare('SELECT * FROM recap_photos ORDER BY created_at DESC, id DESC').all();
    return res.json({ recaps });
  } catch (err) {
    console.error('[recaps] List error:', err);
    return res.status(500).json({ error: 'Could not load recap photos.' });
  }
});

// POST /api/recaps — admin only. Image is REQUIRED.
router.post('/', requireAdmin, uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'An image is required to add a recap photo.', fields: { image: 'Choose an image to upload.' } });
    }

    const { errors, data } = validateRecapText(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    let imageUrl;
    try {
      imageUrl = await storage.uploadImage(req.file, 'recaps');
    } catch (err) {
      console.error('[recaps] Image upload failed:', err);
      return res.status(502).json({ error: 'Could not save the recap image. Try again.' });
    }

    const result = db
      .prepare('INSERT INTO recap_photos (image_url, title, caption, event_label) VALUES (?, ?, ?, ?)')
      .run(imageUrl, data.title, data.caption, data.event_label);

    const recap = db.prepare('SELECT * FROM recap_photos WHERE id = ?').get(result.lastInsertRowid);
    airtable.syncRecord('recaps', recapAirtableFields(recap));
    return res.status(201).json({ ok: true, recap });
  } catch (err) {
    console.error('[recaps] Create error:', err);
    return res.status(500).json({ error: 'Could not save the recap photo.' });
  }
});

// DELETE /api/recaps/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return res.status(404).json({ error: 'Recap not found.' });

    const existing = db.prepare('SELECT * FROM recap_photos WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Recap not found.' });

    db.prepare('DELETE FROM recap_photos WHERE id = ?').run(id);
    if (existing.image_url) storage.deleteImage(existing.image_url);
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('[recaps] Delete error:', err);
    return res.status(500).json({ error: 'Could not delete the recap photo.' });
  }
});

module.exports = router;
