/**
 * routes/events.js
 * ---------------------------------------------------------------
 * Event CRUD.
 *
 *   GET    /api/events      — public (homepage reads this)
 *   POST   /api/events      — admin only
 *   PUT    /api/events/:id  — admin only
 *   DELETE /api/events/:id  — admin only
 *
 * Events persist in SQLite — never localStorage — so they survive
 * refreshes, restarts, and different browsers.
 * ---------------------------------------------------------------
 */

const express = require('express');
const { db } = require('../database');
const requireAdmin = require('../middleware/requireAdmin');
const { uploadSingle } = require('../middleware/upload');
const storage = require('../services/storageService');
const airtable = require('../services/airtableService');
const {
  clean,
  isPresent,
  isOptionalUrl,
  isDate,
  isTime,
} = require('../validators');

const router = express.Router();

/**
 * Coerce a value to 0/1. Works for JSON booleans AND multipart strings
 * (FormData sends checkboxes as "1"/"0"/"true"/"on", never real bools).
 */
function parseBool(value) {
  if (value === true || value === 1) return 1;
  const v = String(value == null ? '' : value).toLowerCase();
  return v === '1' || v === 'true' || v === 'on' ? 1 : 0;
}

/** Validate an incoming event payload. Returns { errors, data }. */
function validateEvent(body) {
  const errors = {};
  const data = {
    name: clean(body.name),
    concept_type: clean(body.concept_type),
    date: clean(body.date),
    time: clean(body.time),
    location: clean(body.location),
    description: clean(body.description),
    ticket_link: clean(body.ticket_link),
    rsvp_enabled: parseBool(body.rsvp_enabled),
  };

  if (!isPresent(data.name, 120)) errors.name = 'Event name is required (max 120 characters).';
  if (!isPresent(data.concept_type, 60)) errors.concept_type = 'Concept/type is required.';
  if (!isDate(data.date)) errors.date = 'Date is required (YYYY-MM-DD).';
  if (!isTime(data.time)) errors.time = 'Time is required (HH:MM, 24-hour).';
  if (!isPresent(data.location, 200)) errors.location = 'Location is required.';
  if (data.description.length > 1000) errors.description = 'Description is too long (max 1000 characters).';
  if (!isOptionalUrl(data.ticket_link)) errors.ticket_link = 'Ticket link must be a valid http(s) URL.';

  return { errors, data };
}

/** Parse and verify a numeric :id param. Returns the row or null. */
function findEvent(idParam) {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id < 1) return null;
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) || null;
}

// GET /api/events — public
router.get('/', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY date ASC, time ASC').all();
    return res.json({ events });
  } catch (err) {
    console.error('[events] List error:', err);
    return res.status(500).json({ error: 'Could not load events.' });
  }
});

/** Shape an event row for the OPTIONAL Airtable mirror. */
function eventAirtableFields(event) {
  return {
    Name: event.name,
    Concept: event.concept_type,
    Date: event.date,
    Time: event.time,
    Location: event.location,
    Description: event.description,
    'Ticket Link': event.ticket_link,
    'Image URL': event.image_url,
    'RSVP Enabled': Boolean(event.rsvp_enabled),
  };
}

// POST /api/events — admin only. Accepts an OPTIONAL `image` upload.
router.post('/', requireAdmin, uploadSingle('image'), async (req, res) => {
  try {
    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    // Image is optional for events. If one was uploaded, store it first.
    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await storage.uploadImage(req.file, 'events');
      } catch (err) {
        console.error('[events] Image upload failed:', err);
        return res.status(502).json({ error: 'Could not save the event image. Try again.' });
      }
    }

    const result = db
      .prepare(
        `INSERT INTO events (name, concept_type, date, time, location, description, ticket_link, image_url, rsvp_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.name,
        data.concept_type,
        data.date,
        data.time,
        data.location,
        data.description,
        data.ticket_link,
        imageUrl,
        data.rsvp_enabled
      );

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    // Optional Airtable mirror — never blocks the response.
    airtable.syncRecord('events', eventAirtableFields(event));
    return res.status(201).json({ ok: true, event });
  } catch (err) {
    console.error('[events] Create error:', err);
    return res.status(500).json({ error: 'Could not create the event.' });
  }
});

// PUT /api/events/:id — admin only. Optional `image` replaces the
// current one; send `remove_image=1` to clear it without uploading.
router.put('/:id', requireAdmin, uploadSingle('image'), async (req, res) => {
  try {
    const existing = findEvent(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found.' });

    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    // Decide the new image_url: new upload > explicit removal > keep existing.
    let imageUrl = existing.image_url || '';
    let oldImageToDelete = '';
    if (req.file) {
      try {
        imageUrl = await storage.uploadImage(req.file, 'events');
        oldImageToDelete = existing.image_url || '';
      } catch (err) {
        console.error('[events] Image upload failed:', err);
        return res.status(502).json({ error: 'Could not save the event image. Try again.' });
      }
    } else if (parseBool(req.body.remove_image)) {
      imageUrl = '';
      oldImageToDelete = existing.image_url || '';
    }

    db.prepare(
      `UPDATE events
       SET name = ?, concept_type = ?, date = ?, time = ?, location = ?,
           description = ?, ticket_link = ?, image_url = ?, rsvp_enabled = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      data.name,
      data.concept_type,
      data.date,
      data.time,
      data.location,
      data.description,
      data.ticket_link,
      imageUrl,
      data.rsvp_enabled,
      existing.id
    );

    // Remove the superseded image only after the DB row is updated.
    if (oldImageToDelete && oldImageToDelete !== imageUrl) storage.deleteImage(oldImageToDelete);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(existing.id);
    airtable.syncRecord('events', eventAirtableFields(event));
    return res.json({ ok: true, event });
  } catch (err) {
    console.error('[events] Update error:', err);
    return res.status(500).json({ error: 'Could not update the event.' });
  }
});

// DELETE /api/events/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const existing = findEvent(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found.' });

    db.prepare('DELETE FROM events WHERE id = ?').run(existing.id);
    if (existing.image_url) storage.deleteImage(existing.image_url); // tidy up the file
    return res.json({ ok: true, deletedId: existing.id });
  } catch (err) {
    console.error('[events] Delete error:', err);
    return res.status(500).json({ error: 'Could not delete the event.' });
  }
});

module.exports = router;
