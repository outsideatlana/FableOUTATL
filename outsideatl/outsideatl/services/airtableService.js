/**
 * services/airtableService.js
 * ---------------------------------------------------------------
 * OPTIONAL Airtable mirroring of submissions/records.
 *
 * The local database (SQLite) is always the source of truth. When
 * ENABLE_AIRTABLE_SYNC=true, records are ALSO pushed to Airtable as a
 * convenience mirror (so non-technical teammates can browse RSVPs etc.
 * in a familiar spreadsheet UI).
 *
 * DESIGN RULES:
 *  - Sync happens AFTER the DB write succeeds. Airtable is never on the
 *    critical path of a user request.
 *  - A failed sync is logged and swallowed — it must NEVER turn a
 *    successful submission into an error for the visitor.
 *
 * SECURITY: AIRTABLE_API_KEY is a backend-only secret. Never expose it
 * to frontend JavaScript. All Airtable calls happen here, server-side.
 * ---------------------------------------------------------------
 */

const SYNC_ENABLED = String(process.env.ENABLE_AIRTABLE_SYNC || 'false').toLowerCase() === 'true';

// Logical table key -> the env var holding that table's Airtable name.
const TABLE_ENV = {
  rsvps: 'AIRTABLE_RSVP_TABLE',
  signups: 'AIRTABLE_SIGNUPS_TABLE',
  applications: 'AIRTABLE_APPLICATIONS_TABLE',
  events: 'AIRTABLE_EVENTS_TABLE',
  recaps: 'AIRTABLE_RECAPS_TABLE',
};

let _base = null;
function getBase() {
  if (_base) return _base;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error('Airtable sync enabled but AIRTABLE_API_KEY / AIRTABLE_BASE_ID are not set.');
  }
  const Airtable = require('airtable'); // lazy: only loaded when sync is actually used
  _base = new Airtable({ apiKey }).base(baseId);
  return _base;
}

function isEnabled() {
  return SYNC_ENABLED;
}

/**
 * Mirror one record to Airtable. Fire-and-forget: callers do NOT await
 * this (or if they do, it still never rejects). Returns a promise that
 * always resolves.
 *
 * @param {string} tableKey  one of: rsvps, signups, applications, events, recaps
 * @param {object} fields    Airtable field map { "Field Name": value }
 */
async function syncRecord(tableKey, fields) {
  if (!SYNC_ENABLED) return;
  try {
    const tableName = process.env[TABLE_ENV[tableKey]];
    if (!tableName) {
      console.warn(`[airtable] No table name configured for "${tableKey}" — skipping sync.`);
      return;
    }
    await getBase()(tableName).create([{ fields }]);
  } catch (err) {
    // Log safely; do not leak the error to the visitor.
    console.error(`[airtable] Sync to "${tableKey}" failed (submission was still saved):`, err.message);
  }
}

module.exports = { isEnabled, syncRecord };
