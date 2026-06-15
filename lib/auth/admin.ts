import 'server-only';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from './session';

/**
 * Admin credential verification + session cookie management.
 *
 * SECURITY:
 *  - Credentials live ONLY in env (ADMIN_USERNAME, ADMIN_PASSWORD_HASH).
 *    The browser never receives the username, hash, or session secret.
 *  - The password is checked with bcrypt server-side. We always run a
 *    bcrypt compare (against a dummy hash on username mismatch) to keep
 *    timing constant and avoid username enumeration.
 *  - The session is an httpOnly, signed (HS256) JWT cookie.
 */

// Precomputed dummy hash for timing equalization (hash of "invalid").
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvH1mQ3pV6r6Q1k9q1aQ1aQ1aQ1a';

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !expectedHash) {
    console.error('[auth] ADMIN_USERNAME / ADMIN_PASSWORD_HASH not configured.');
    return false;
  }
  const userMatches = username === expectedUser;
  const ok = await bcrypt.compare(
    password,
    userMatches ? expectedHash : DUMMY_HASH,
  );
  return userMatches && ok;
}

/** Create the session and write the httpOnly cookie. */
export async function startSession(username: string): Promise<void> {
  const token = await signSession(username);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Read + verify the current admin session (server components / routes). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession()) !== null;
}
