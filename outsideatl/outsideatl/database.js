/**
 * database.js
 * ---------------------------------------------------------------
 * SQLite persistence layer for OutsideAtl.
 *
 * Uses Node's built-in `node:sqlite` module (Node >= 22.5), so the
 * project has ZERO native dependencies — no node-gyp, no compiler,
 * nothing to build. The data still lives in a real SQLite file on
 * disk (outsideatl.db), so everything survives restarts.
 *
 * If you ever want to switch to the `better-sqlite3` npm package,
 * the API used here (prepare / run / get / all / exec) is nearly
 * identical — only this file would need small edits.
 * ---------------------------------------------------------------
 */

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'outsideatl.db');

const db = new DatabaseSync(DB_PATH);

// Better concurrency + integrity for a small web app.
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Create all required tables if they do not exist, then seed
 * default events when the events table is empty.
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      concept_type  TEXT    NOT NULL DEFAULT '',
      date          TEXT    NOT NULL,
      time          TEXT    NOT NULL,
      location      TEXT    NOT NULL DEFAULT '',
      description   TEXT    NOT NULL DEFAULT '',
      ticket_link   TEXT    NOT NULL DEFAULT '',
      rsvp_enabled  INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT NOT NULL,
      event_name  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS signups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT NOT NULL,
      phone       TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      application_type  TEXT NOT NULL CHECK (application_type IN ('career','internship','vendor','artist')),
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      role_interest     TEXT NOT NULL,
      message           TEXT NOT NULL DEFAULT '',
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrateApplicationTypes();
  seedDefaultEvents();
}

/**
 * Databases created before the 'artist' application type was added
 * have a CHECK constraint that rejects it. SQLite can't alter a
 * CHECK in place, so rebuild the table once, preserving all rows.
 */
function migrateApplicationTypes() {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'applications'")
    .get();
  if (!row || row.sql.includes("'artist'")) return;

  db.exec(`
    BEGIN;
    ALTER TABLE applications RENAME TO applications_old;
    CREATE TABLE applications (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      application_type  TEXT NOT NULL CHECK (application_type IN ('career','internship','vendor','artist')),
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      role_interest     TEXT NOT NULL,
      message           TEXT NOT NULL DEFAULT '',
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO applications SELECT * FROM applications_old;
    DROP TABLE applications_old;
    COMMIT;
  `);
  console.log("[db] Migrated applications table to allow the 'artist' type");
}

/**
 * Seed the three default OutsideAtl event concepts — but only when
 * the events table is completely empty, so admin edits are never
 * overwritten on restart.
 */
function seedDefaultEvents() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM events').get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO events (name, concept_type, date, time, location, description, ticket_link, rsvp_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaults = [
    {
      name: 'Silent Disco',
      concept_type: 'Party',
      date: '2026-07-18',
      time: '21:00',
      location: 'Old Fourth Ward — exact spot drops on RSVP',
      description:
        'Three DJs. Three channels. One rooftop full of glowing headphones. Pick your frequency and dance to your own crowd under the Atlanta skyline.',
      ticket_link: '',
      rsvp_enabled: 1,
    },
    {
      name: 'Rooftop Game Night',
      concept_type: 'Social',
      date: '2026-07-25',
      time: '19:30',
      location: 'Midtown rooftop — address sent to the list',
      description:
        'Spades, UNO, dominoes, and a DJ keeping the energy right. Golden hour start, city-lights finish. Bring a partner or get drafted.',
      ticket_link: '',
      rsvp_enabled: 1,
    },
    {
      name: 'Artist Pop-Up',
      concept_type: 'Pop-Up',
      date: '2026-08-08',
      time: '18:00',
      location: 'West End warehouse — limited capacity',
      description:
        'Live sets from rising ATL artists, local vendors, and visuals on every wall. One night only. When it\u2019s gone, it\u2019s gone.',
      ticket_link: '',
      rsvp_enabled: 1,
    },
  ];

  for (const e of defaults) {
    insert.run(
      e.name,
      e.concept_type,
      e.date,
      e.time,
      e.location,
      e.description,
      e.ticket_link,
      e.rsvp_enabled
    );
  }

  console.log('[db] Seeded default events: Silent Disco, Rooftop Game Night, Artist Pop-Up');
}

module.exports = { db, initDatabase };
