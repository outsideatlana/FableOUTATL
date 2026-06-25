import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Admin soft-delete ("hide") list for dashboard log tables.
 *
 * Hiding a record only records its (source_table, source_record_id) here so
 * it is filtered out of admin reads (see lib/data/admin.ts). It NEVER deletes
 * the underlying Supabase row, and it NEVER touches Airtable — the Airtable
 * RSVPS / APPLICATIONS records are left exactly as they are.
 *
 * SECURITY:
 *  - Every method requires a verified admin session (getSession()).
 *  - All DB access goes through the service role on the server only; the
 *    service role key and Airtable key never reach the browser.
 */

const bodySchema = z.object({
  source_table: z.enum(['rsvps', 'applications']),
  source_record_id: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// POST /api/admin/hidden-records — hide (soft-delete) a record from the dashboard.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const { source_table, source_record_id, reason } = parsed.data;
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase.from('admin_hidden_records').upsert(
      {
        source_table,
        source_record_id,
        reason: reason ?? null,
        hidden_by: session.sub ?? null,
      },
      { onConflict: 'source_table,source_record_id', ignoreDuplicates: true },
    );
    if (error) {
      console.error('[hidden-records] hide:', error.message);
      return NextResponse.json({ error: 'Could not hide record.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[hidden-records] post error:', err);
    return NextResponse.json({ error: 'Could not hide record.' }, { status: 500 });
  }
}

// DELETE /api/admin/hidden-records — restore (unhide) a record.
// Only removes it from the hidden list; nothing else is modified.
export async function DELETE(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const { source_table, source_record_id } = parsed.data;
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .from('admin_hidden_records')
      .delete()
      .eq('source_table', source_table)
      .eq('source_record_id', source_record_id);
    if (error) {
      console.error('[hidden-records] restore:', error.message);
      return NextResponse.json({ error: 'Could not restore record.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[hidden-records] delete error:', err);
    return NextResponse.json({ error: 'Could not restore record.' }, { status: 500 });
  }
}
