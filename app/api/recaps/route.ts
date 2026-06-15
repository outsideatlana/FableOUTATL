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

// GET /api/recaps — public gallery.
export async function GET() {
  const recaps = await getPublicRecaps();
  return NextResponse.json({ recaps });
}

// POST /api/recaps — admin: save recap metadata. The image is uploaded to
// Vercel Blob first (client → /api/upload); this stores the resulting
// url + pathname plus caption / event / sort order in Supabase.
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = recapCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }
    const data = parsed.data;

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
        event_id: data.event_id,
        image_url: data.image_url,
        image_pathname: data.image_pathname,
        caption: data.caption,
        sort_order: data.sort_order,
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
