/**
 * middleware/requireAdmin.js
 * ---------------------------------------------------------------
 * Gatekeeper for admin-only API routes.
 *
 * Authentication state lives in a server-side session (see
 * routes/auth.js). The browser only ever holds an opaque, signed
 * session cookie — never credentials, never a role flag it could
 * tamper with.
 *
 * SECURITY NOTE: Checking "isAdmin" in frontend JavaScript or
 * localStorage is NOT authentication — anyone can flip that value
 * in DevTools. Protection must happen here, on the server, for
 * every privileged request.
 * ---------------------------------------------------------------
 */

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }
  // 401 = not authenticated. Keep the message generic — don't leak
  // whether a session existed, expired, or was tampered with.
  return res.status(401).json({ error: 'Authentication required.' });
}

module.exports = requireAdmin;
