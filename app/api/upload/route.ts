import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { uploadImage, UploadError, type UploadFolder } from '@/lib/supabase/storage';

export const runtime = 'nodejs';

// POST /api/upload — admin: upload one image, return its public URL.
// Body: multipart/form-data with `image` (File) and optional `folder`.
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get('image');
    const folderRaw = String(form.get('folder') || 'events');
    const folder: UploadFolder = folderRaw === 'recaps' ? 'recaps' : 'events';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }
    const url = await uploadImage(file, folder);
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Could not upload the image.' }, { status: 500 });
  }
}
