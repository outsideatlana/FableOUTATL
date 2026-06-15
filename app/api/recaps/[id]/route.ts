import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { deleteFromBlob } from '@/lib/blob/upload';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  caption: z.string().max(280).nullable().optional(),
  event_id: z.string().uuid().nullable().optional(),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
});

// PATCH /api/recaps/:id — admin: edit caption / event / order.
export async function PATCH(request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const json = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid recap update.' }, { status: 400 });
    }
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from('recaps')
      .update(parsed.data)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[recaps] patch:', error.message);
      return NextResponse.json({ error: 'Could not update the recap.' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Recap not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, recap: data });
  } catch (err) {
    console.error('[recaps] patch error:', err);
    return NextResponse.json({ error: 'Could not update the recap.' }, { status: 500 });
  }
}

// DELETE /api/recaps/:id — admin: delete a recap photo (and its image).
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    const { data: existing } = await supabase
      .from('recaps')
      .select('image_url, image_pathname')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('recaps').delete().eq('id', id);
    if (error) {
      console.error('[recaps] delete:', error.message);
      return NextResponse.json({ error: 'Could not delete the recap.' }, { status: 500 });
    }
    // Remove the blob too (prefer pathname; falls back to the full URL).
    await deleteFromBlob(existing?.image_pathname || existing?.image_url);
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('[recaps] delete error:', err);
    return NextResponse.json({ error: 'Could not delete the recap.' }, { status: 500 });
  }
}
