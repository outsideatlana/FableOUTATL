import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/admin';

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
