import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { getPublicRecaps } from '@/lib/data/public';
import {
  uploadToBlob,
  assertValidUpload,
  UploadValidationError,
  IMAGE_TYPES,
} from '@/lib/blob/upload';
import { recapMetaSchema, fieldErrors } from '@/lib/validation/schemas';
import { airtable } from '@/lib/airtable/sync';

export const runtime = 'nodejs';

// GET /api/recaps — public gallery.
export async function GET() {
  const recaps = await getPublicRecaps();
  return NextResponse.json({ recaps });
}

// POST /api/recaps — admin: upload a recap photo (multipart). Image required.
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'An image is required.', fields: { image: 'Choose an image to upload.' } },
        { status: 400 },
      );
    }
    const parsed = recapMetaSchema.safeParse({
      event_id: form.get('event_id'),
      caption: form.get('caption'),
      sort_order: form.get('sort_order'),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    assertValidUpload(file, IMAGE_TYPES);
    const blob = await uploadToBlob({
      folder: 'recaps',
      filename: file.name,
      body: file,
      contentType: file.type,
      access: 'public',
    });

    const supabase = requireSupabaseAdmin();
    const { data: recap, error } = await supabase
      .from('recaps')
      .insert({
        event_id: parsed.data.event_id,
        image_url: blob.url,
        image_pathname: blob.pathname,
        caption: parsed.data.caption,
        sort_order: parsed.data.sort_order,
      })
      .select('*')
      .single();
    if (error) {
      console.error('[recaps] insert:', error.message);
      return NextResponse.json({ error: 'Could not save the recap photo.' }, { status: 500 });
    }

    await airtable.recap({ caption: recap.caption, image_url: recap.image_url });
    return NextResponse.json({ ok: true, recap }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[recaps] error:', err);
    return NextResponse.json({ error: 'Could not save the recap photo.' }, { status: 500 });
  }
}
