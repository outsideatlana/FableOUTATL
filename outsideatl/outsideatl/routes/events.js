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
const {
  clean,
  isPresent,
  isOptionalUrl,
  isDate,
  isTime,
} = require('../validators');

const router = express.Router();

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
    rsvp_enabled: body.rsvp_enabled ? 1 : 0,
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

// POST /api/events — admin only
router.post('/', requireAdmin, (req, res) => {
  try {
    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const result = db
      .prepare(
        `INSERT INTO events (name, concept_type, date, time, location, description, ticket_link, rsvp_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.name,
        data.concept_type,
        data.date,
        data.time,
        data.location,
        data.description,
        data.ticket_link,
        data.rsvp_enabled
      );

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ ok: true, event });
  } catch (err) {
    console.error('[events] Create error:', err);
    return res.status(500).json({ error: 'Could not create the event.' });
  }
});

// PUT /api/events/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const existing = findEvent(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found.' });

    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    db.prepare(
      `UPDATE events
       SET name = ?, concept_type = ?, date = ?, time = ?, location = ?,
           description = ?, ticket_link = ?, rsvp_enabled = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      data.name,
      data.concept_type,
      data.date,
      data.time,
      data.location,
      data.description,
      data.ticket_link,
      data.rsvp_enabled,
      existing.id
    );

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(existing.id);
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
    return res.json({ ok: true, deletedId: existing.id });
  } catch (err) {
    console.error('[events] Delete error:', err);
    return res.status(500).json({ error: 'Could not delete the event.' });
  }
});

module.exports = router;
