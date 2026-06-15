import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { getSession } from '@/lib/auth/admin';

export const runtime = 'nodejs';

/**
 * GET /api/blob/<pathname> — ADMIN ONLY. Streams a PRIVATE Vercel Blob
 * (e.g. sensitive application files) to an authenticated admin. Public
 * blobs (event/recap images) are served directly from their blob URL and
 * do NOT go through this route.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { pathname } = await params;
    const key = pathname.join('/');
    const result = await get(key, { access: 'private' });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'application/octet-stream',
        'Content-Disposition': result.blob.contentDisposition,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[blob] private fetch failed:', err);
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
}
