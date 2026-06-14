/**
 * routes/forms.js
 * ---------------------------------------------------------------
 * Public form submissions:
 *   POST /api/rsvps         — event RSVPs
 *   POST /api/signups       — "Know What's Happening" 5%-off list
 *   POST /api/applications  — careers / internships / vendors / artists
 *
 * Every submission is validated server-side and stored in SQLite.
 * (Frontend validation is UX only; never trust the client.)
 * ---------------------------------------------------------------
 */

const express = require('express');
const { db } = require('../database');
const airtable = require('../services/airtableService');
const {
  clean,
  isPresent,
  isEmail,
  isPhone,
  APPLICATION_TYPES,
} = require('../validators');

const router = express.Router();

// POST /api/rsvps
router.post('/rsvps', (req, res) => {
  try {
    const data = {
      name: clean(req.body.name),
      email: clean(req.body.email),
      phone: clean(req.body.phone),
      event_name: clean(req.body.event_name),
    };

    const errors = {};
    if (!isPresent(data.name, 120)) errors.name = 'Full name is required.';
    if (!isEmail(data.email)) errors.email = 'Enter a valid email address.';
    if (!isPhone(data.phone)) errors.phone = 'Enter a valid phone number.';
    if (!isPresent(data.event_name, 120)) errors.event_name = 'Event name is missing.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const result = db
      .prepare('INSERT INTO rsvps (name, email, phone, event_name) VALUES (?, ?, ?, ?)')
      .run(data.name, data.email, data.phone, data.event_name);

    // OPTIONAL Airtable mirror (after the DB save; never blocks the user).
    airtable.syncRecord('rsvps', {
      Name: data.name, Email: data.email, Phone: data.phone, Event: data.event_name,
    });

    return res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error('[forms] RSVP error:', err);
    return res.status(500).json({ error: 'Could not save your RSVP. Try again.' });
  }
});

// POST /api/signups
router.post('/signups', (req, res) => {
  try {
    const data = {
      email: clean(req.body.email),
      phone: clean(req.body.phone),
    };

    const errors = {};
    if (!isEmail(data.email)) errors.email = 'Enter a valid email address.';
    if (!isPhone(data.phone)) errors.phone = 'Enter a valid phone number.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const result = db
      .prepare('INSERT INTO signups (email, phone) VALUES (?, ?)')
      .run(data.email, data.phone);

    airtable.syncRecord('signups', { Email: data.email, Phone: data.phone });

    return res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error('[forms] Signup error:', err);
    return res.status(500).json({ error: 'Could not save your signup. Try again.' });
  }
});

// POST /api/applications
router.post('/applications', (req, res) => {
  try {
    const data = {
      application_type: clean(req.body.application_type).toLowerCase(),
      name: clean(req.body.name),
      email: clean(req.body.email),
      role_interest: clean(req.body.role_interest),
      message: clean(req.body.message),
    };

    const errors = {};
    if (!APPLICATION_TYPES.includes(data.application_type)) {
      errors.application_type = 'Application type must be career, internship, vendor, or artist.';
    }
    if (!isPresent(data.name, 120)) errors.name = 'Full name is required.';
    if (!isEmail(data.email)) errors.email = 'Enter a valid email address.';
    if (!isPresent(data.role_interest, 200)) errors.role_interest = 'Tell us the role or opportunity you\u2019re interested in.';
    if (!isPresent(data.message, 2000)) errors.message = 'A short message or bio is required (max 2000 characters).';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const result = db
      .prepare(
        'INSERT INTO applications (application_type, name, email, role_interest, message) VALUES (?, ?, ?, ?, ?)'
      )
      .run(data.application_type, data.name, data.email, data.role_interest, data.message);

    airtable.syncRecord('applications', {
      Type: data.application_type, Name: data.name, Email: data.email,
      'Role Interest': data.role_interest, Message: data.message,
    });

    return res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error('[forms] Application error:', err);
    return res.status(500).json({ error: 'Could not save your application. Try again.' });
  }
});

module.exports = router;
