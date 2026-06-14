import { NextResponse } from 'next/server';
import { verifyCredentials, startSession } from '@/lib/auth/admin';

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

    const ok = await verifyCredentials(username, password);
    if (!ok) {
      // Generic message — never reveal which field was wrong.
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 },
      );
    }

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
