/**
 * server.js
 * ---------------------------------------------------------------
 * OutsideAtl — Express entry point.
 *
 * Run locally:
 *   npm install
 *   npm start          (or `npm run dev` for auto-restart)
 *
 * Routes:
 *   /                — public landing page (public/index.html)
 *   /admin           — admin login + dashboard (public/admin.html)
 *   /api/auth/*      — login / logout / me
 *   /api/events/*    — public list + admin CRUD
 *   /api/rsvps, /api/signups, /api/applications — public forms
 * ---------------------------------------------------------------
 */

require('dotenv').config();

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');

const { initDatabase } = require('./database');
const { UPLOADS_ROOT } = require('./services/storageService');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const recapRoutes = require('./routes/recaps');
const formRoutes = require('./routes/forms');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- Database --------------------------------------------------
initDatabase();

// --- Config sanity checks --------------------------------------
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  // Generate a throwaway secret so dev still works, but warn loudly:
  // a random secret per boot means all sessions die on restart.
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    '[config] SESSION_SECRET is not set. Generated a temporary one — ' +
      'sessions will NOT survive restarts. Copy .env.example to .env and set it.'
  );
}
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
  console.warn(
    '[config] ADMIN_USERNAME / ADMIN_PASSWORD_HASH not set — admin login is disabled. ' +
      'See README "Admin login setup" (npm run hash-password -- "yourPassword").'
  );
}

// --- Middleware ------------------------------------------------
app.use(express.json({ limit: '50kb' })); // small limit: these are simple forms
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    name: 'outsideatl.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JS can't read the cookie — mitigates XSS token theft
      sameSite: 'lax', // mitigates CSRF for state-changing requests
      // PRODUCTION: set `secure: true` once the site is served over HTTPS,
      // and use a persistent session store (the default MemoryStore leaks
      // memory and forgets sessions on restart — fine for a prototype only).
      secure: false,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Static frontend (landing page, admin page, CSS, JS).
app.use(express.static(path.join(__dirname, 'public')));

// Locally/disk-stored uploads are served from /uploads. (When
// STORAGE_PROVIDER=supabase, images are served by Supabase instead and
// this route simply goes unused.)
app.use('/uploads', express.static(UPLOADS_ROOT));

// --- API routes ------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/recaps', recapRoutes);
app.use('/api', formRoutes); // /api/rsvps, /api/signups, /api/applications

// Friendly route for the admin page.
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- 404 + error handling --------------------------------------
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found.' });
  }
  return res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Central error handler: log details server-side, return a safe
// generic message to the client (never leak stack traces).
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: 'Something went wrong on our end.' });
});

app.listen(PORT, () => {
  console.log(`OutsideAtl running → http://localhost:${PORT}`);
  console.log(`Admin dashboard   → http://localhost:${PORT}/admin`);
});
