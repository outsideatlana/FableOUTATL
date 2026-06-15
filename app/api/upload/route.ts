import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_SERVER_UPLOAD_BYTES,
  UPLOAD_FOLDERS,
  buildPathname,
  type UploadFolder,
} from '@/lib/blob/upload';

export const runtime = 'nodejs';

/**
 * POST /api/upload?filename=<name>&folder=<folder>
 *
 * Official Next.js App Router *server upload*: the client sends the raw
 * file body; this route streams it to Vercel Blob via `put()` and returns
 * the blob result. ADMIN ONLY — uploads to events/recaps/applications/
 * interest require a valid admin session. Server uploads are capped at
 * 4.5 MB (use client uploads for larger files).
 *
 * SECURITY: BLOB_READ_WRITE_TOKEN is read by `put()` server-side only and
 * is never sent to the browser.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Real admin auth — no public uploads.
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const folder = (searchParams.get('folder') || 'events') as UploadFolder;
    const contentType = request.headers.get('content-type') || '';
    const contentLength = request.headers.get('content-length');

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename.' }, { status: 400 });
    }
    if (!UPLOAD_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder.' }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WEBP, and GIF files are allowed.' },
        { status: 400 },
      );
    }
    if (contentLength && Number(contentLength) > MAX_SERVER_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Max server upload size is 4.5 MB.' },
        { status: 400 },
      );
    }
    if (!request.body) {
      return NextResponse.json({ error: 'Missing file body.' }, { status: 400 });
    }

    const pathname = buildPathname(folder, filename);
    const blob = await put(pathname, request.body, { access: 'public', contentType });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });
  } catch (error) {
    console.error('Blob upload failed:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
