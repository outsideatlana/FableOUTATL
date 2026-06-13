/**
 * routes/auth.js
 * ---------------------------------------------------------------
 * Admin authentication: POST /api/auth/login, POST /api/auth/logout,
 * GET /api/auth/me.
 *
 * Credentials live in environment variables:
 *   ADMIN_USERNAME       — plain username
 *   ADMIN_PASSWORD_HASH  — bcrypt hash of the password
 *
 * Generate a hash with:  npm run hash-password -- "yourPassword"
 *
 * SECURITY NOTES (read before shipping to production):
 *  - Never put credentials in frontend JS. Anything the browser can
 *    read, a visitor can read. Client-side "login checks" are
 *    decoration, not security — the server must verify every request.
 *  - bcrypt comparison is intentionally slow, which blunts brute
 *    force. We also compare against a dummy hash when the username
 *    is wrong so both failure paths take similar time.
 *  - For production add: rate limiting on this route, HTTPS-only
 *    cookies (set `cookie.secure: true` behind TLS), and a real
 *    secret manager instead of a .env file.
 * ---------------------------------------------------------------
 */

const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Dummy hash ("not-the-password") used to equalize timing when the
// username doesn't match — prevents username enumeration via timing.
const DUMMY_HASH = bcrypt.hashSync('not-the-password', 10);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedUser || !expectedHash) {
      console.error('[auth] ADMIN_USERNAME / ADMIN_PASSWORD_HASH not configured.');
      return res.status(500).json({ error: 'Server is not configured for admin login.' });
    }

    const userMatches = username === expectedUser;
    // Always run a bcrypt compare so wrong-username and wrong-password
    // responses take roughly the same time.
    const passwordMatches = await bcrypt.compare(password, userMatches ? expectedHash : DUMMY_HASH);

    if (!userMatches || !passwordMatches) {
      // Generic message on purpose — never reveal which field was wrong.
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Rotate the session ID on privilege change to prevent session fixation.
    req.session.regenerate((err) => {
      if (err) {
        console.error('[auth] Session regenerate failed:', err);
        return res.status(500).json({ error: 'Could not start a session. Try again.' });
      }
      req.session.isAdmin = true;
      req.session.username = username;
      return res.json({ ok: true, username });
    });
  } catch (err) {
    console.error('[auth] Login error:', err);
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[auth] Logout error:', err);
      return res.status(500).json({ error: 'Could not log out. Try again.' });
    }
    res.clearCookie('outsideatl.sid');
    return res.json({ ok: true });
  });
});

// GET /api/auth/me — lets the dashboard check auth state on load.
router.get('/me', (req, res) => {
  const authenticated = Boolean(req.session && req.session.isAdmin);
  return res.json({
    authenticated,
    username: authenticated ? req.session.username : null,
  });
});

module.exports = router;
