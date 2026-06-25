import { NextResponse } from 'next/server';
import { verifyCredentials, startSession } from '@/lib/auth/admin';
import {
  getClientIp,
  buildIdentifier,
  isRateLimited,
  recordAttempt,
  clearFailures,
  RATE_LIMIT_MESSAGE,
} from '@/lib/auth/rate-limit';

export const runtime = 'nodejs'; // bcrypt requires the Node runtime

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 },
      );
    }

    // Rate-limit key: IP + username (server-derived; never trusted from body).
    const identifier = buildIdentifier(getClientIp(request), username);

    // Throttle BEFORE checking credentials: 5 failures / 5 min → blocked.
    if (await isRateLimited(identifier)) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const ok = await verifyCredentials(username, password);
    if (!ok) {
      await recordAttempt(identifier, false);
      // Generic message — never reveal which field was wrong.
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 },
      );
    }

    // Success: log it, wipe the failure counter, then set the session cookie.
    await recordAttempt(identifier, true);
    await clearFailures(identifier);
    await startSession(username);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth] login error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Try again.' },
      { status: 500 },
    );
  }
}
