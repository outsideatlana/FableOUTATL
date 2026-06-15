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
