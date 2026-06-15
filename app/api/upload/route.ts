import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_SERVER_UPLOAD_BYTES,
  UPLOAD_FOLDERS,
  buildPathname,
  type UploadFolder,
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import {
  uploadToBlob,
  assertValidUpload,
  UploadValidationError,
  IMAGE_TYPES,
  DOC_TYPES,
  MAX_UPLOAD_BYTES,
  type BlobAccess,
  type BlobFolder,
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
const ALLOWED_FOLDERS: BlobFolder[] = ['events', 'recaps', 'applications', 'articles'];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES];

/**
 * POST /api/upload — ADMIN ONLY. Upload one file to Vercel Blob and
 * return its URL + pathname (persist these in Supabase). Accepts
 * multipart/form-data: `file`, optional `folder`, optional `access`.
 */
export async function POST(request: NextRequest) {
  // Auth guard — uploads to events/recaps/applications are admin-only.
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
    const form = await request.formData();
    // Accept `file` (spec) and `image` (legacy callers) for compatibility.
    const file = form.get('file') ?? form.get('image');
    const folder = String(form.get('folder') || 'events') as BlobFolder;
    const accessRaw = String(form.get('access') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file upload.' }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder.' }, { status: 400 });
    }

    // Default applications → private; everything else → public.
    const access: BlobAccess =
      accessRaw === 'public' || accessRaw === 'private'
        ? accessRaw
        : folder === 'applications'
          ? 'private'
          : 'public';

    assertValidUpload(file, ALLOWED_TYPES, MAX_UPLOAD_BYTES);

    const blob = await uploadToBlob({
      folder,
      filename: file.name,
      body: file,
      contentType: file.type,
      access,
    });

    return NextResponse.json(
      {
        ok: true,
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: file.size,
        access,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[upload] Blob upload failed:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
