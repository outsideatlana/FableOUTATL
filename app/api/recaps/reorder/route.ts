import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';

const reorderSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })).max(500),
});

// POST /api/recaps/reorder — admin: persist new gallery order.
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = reorderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid reorder payload.' }, { status: 400 });
    }
    const supabase = requireSupabaseAdmin();
    await Promise.all(
      parsed.data.order.map((item) =>
        supabase.from('recaps').update({ sort_order: item.sort_order }).eq('id', item.id),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[recaps] reorder error:', err);
    return NextResponse.json({ error: 'Could not reorder recaps.' }, { status: 500 });
  }
}
