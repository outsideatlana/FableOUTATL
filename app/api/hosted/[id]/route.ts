import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { deleteImage } from '@/lib/supabase/storage';
import { hostedSchema, fieldErrors } from '@/lib/validation/schemas';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/hosted/:id — admin: update an entry; removes the old image if replaced.
export async function PATCH(request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const json = await request.json().catch(() => ({}));
    const parsed = hostedSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const supabase = requireSupabaseAdmin();

    const { data: existing } = await supabase
      .from('hosted')
      .select('image_pathname')
      .eq('id', id)
      .maybeSingle();

    const { data: entry, error } = await supabase
      .from('hosted')
      .update({
        name: data.name,
        image_url: data.image_url,
        image_pathname: data.image_pathname,
        description: data.description,
        link_url: data.link_url,
        sort_order: data.sort_order,
        published: data.published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[hosted] update:', error.message);
      return NextResponse.json({ error: 'Could not update the entry.' }, { status: 500 });
    }
    if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });

    if (existing?.image_pathname && existing.image_pathname !== data.image_pathname) {
      await deleteImage(existing.image_pathname);
    }
    return NextResponse.json({ ok: true, hosted: entry });
  } catch (err) {
    console.error('[hosted] patch error:', err);
    return NextResponse.json({ error: 'Could not update the entry.' }, { status: 500 });
  }
}

// DELETE /api/hosted/:id — admin: delete an entry (and its image).
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    const { data: existing } = await supabase
      .from('hosted')
      .select('image_url, image_pathname')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('hosted').delete().eq('id', id);
    if (error) {
      console.error('[hosted] delete:', error.message);
      return NextResponse.json({ error: 'Could not delete the entry.' }, { status: 500 });
    }
    await deleteImage(existing?.image_pathname || existing?.image_url);
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('[hosted] delete error:', err);
    return NextResponse.json({ error: 'Could not delete the entry.' }, { status: 500 });
  }
}
