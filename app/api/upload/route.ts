import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { uploadImage, assertValidImage, UploadError, type UploadFolder } from '@/lib/supabase/storage';

export const runtime = 'nodejs';

const ALLOWED_FOLDERS: UploadFolder[] = ['events', 'recaps', 'hosted'];

/**
 * POST /api/upload — ADMIN ONLY. Upload one image to Supabase Storage and
 * return its public URL + object path. Body: multipart/form-data with
 * `file` (or `image`) and optional `folder` (events | recaps | hosted).
 *
 * SECURITY: the Supabase service-role key is used only server-side here;
 * it never reaches the browser.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') ?? form.get('image');
    const folder = String(form.get('folder') || 'events') as UploadFolder;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file upload.' }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder.' }, { status: 400 });
    }

    assertValidImage(file);
    const { url, path } = await uploadImage(file, folder);

    return NextResponse.json({ success: true, url, path }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Supabase upload failed:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
