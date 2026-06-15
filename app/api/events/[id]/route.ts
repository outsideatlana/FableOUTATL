import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { eventSchema, fieldErrors } from '@/lib/validation/schemas';
import { deleteFromBlob } from '@/lib/blob/upload';
import { slugify } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/events/:id — admin: update an event.
export async function PATCH(request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const json = await request.json().catch(() => ({}));
    const parsed = eventSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }
    const supabase = requireSupabaseAdmin();
    const data = parsed.data;
    const slug = data.slug ? slugify(data.slug) : undefined;

    const { data: event, error } = await supabase
      .from('events')
      .update({
        title: data.title,
        ...(slug ? { slug } : {}),
        description: data.description,
        event_date: data.event_date,
        location: data.location,
        status: data.status,
        hero_image_url: data.hero_image_url,
        hero_image_pathname: data.hero_image_pathname,
        flyer_image_url: data.flyer_image_url,
        flyer_image_pathname: data.flyer_image_pathname,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[events] update:', error.message);
      return NextResponse.json({ error: 'Could not update the event.' }, { status: 500 });
    }
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error('[events] update error:', err);
    return NextResponse.json({ error: 'Could not update the event.' }, { status: 500 });
  }
}

// DELETE /api/events/:id — admin: delete an event.
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    const { data: existing } = await supabase
      .from('events')
      .select('hero_image_url, hero_image_pathname, flyer_image_url, flyer_image_pathname')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      console.error('[events] delete:', error.message);
      return NextResponse.json({ error: 'Could not delete the event.' }, { status: 500 });
    }
    // Clean up the event's blobs (best-effort).
    await deleteFromBlob(existing?.hero_image_pathname || existing?.hero_image_url);
    await deleteFromBlob(existing?.flyer_image_pathname || existing?.flyer_image_url);
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('[events] delete error:', err);
    return NextResponse.json({ error: 'Could not delete the event.' }, { status: 500 });
  }
}
