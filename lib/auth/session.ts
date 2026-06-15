import { SignJWT, jwtVerify } from 'jose';

/**
 * Edge-safe session token helpers (jose only — no next/headers, no
 * Node APIs), so this module can be imported from middleware AND route
 * handlers. Credential verification (bcrypt) lives in ./admin.ts.
 */

export const SESSION_COOKIE = 'oatl_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // admin username
  role: 'admin';
}

/** Sign a short-lived admin session JWT. Throws if SESSION_SECRET is unset. */
export async function signSession(username: string): Promise<string> {
  const key = getSecretKey();
  if (!key) throw new Error('SESSION_SECRET is not set.');
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

/** Verify a session token. Returns the payload or null when invalid/expired. */
export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  const key = getSecretKey();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.role !== 'admin' || typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, role: 'admin' };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
