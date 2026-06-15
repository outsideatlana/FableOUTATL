import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(['new', 'reviewed', 'contacted', 'accepted', 'rejected']),
});

// PATCH /api/applications/:id — admin: update application status.
export async function PATCH(request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const json = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from('applications')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[applications] status:', error.message);
      return NextResponse.json({ error: 'Could not update status.' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, application: data });
  } catch (err) {
    console.error('[applications] patch error:', err);
    return NextResponse.json({ error: 'Could not update status.' }, { status: 500 });
  }
}
