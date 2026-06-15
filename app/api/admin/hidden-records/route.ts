import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { getHiddenRecords } from '@/lib/data/admin';
import { hideRecordSchema, unhideRecordSchema, fieldErrors } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

/**
 * Admin-only "hidden records" management.
 *
 *   POST   — hide an RSVP / application from the dashboard (soft-delete)
 *   GET    — list everything currently hidden (for the restore view)
 *   DELETE — restore (unhide) a record
 *
 * This is a Supabase-only hide list. Airtable is NEVER called here — the
 * original RSVP / application records remain in their Airtable tables. The
 * Supabase service-role key stays server-side (this route runs server-only).
 */

// POST /api/admin/hidden-records — hide a record from the dashboard.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = hideRecordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = requireSupabaseAdmin();
    const { error } = await supabase.from('admin_hidden_records').upsert(
      {
        source_table: parsed.data.sourceTable,
        source_record_id: parsed.data.sourceRecordId,
        reason: parsed.data.reason,
        hidden_by: session.sub,
      },
      { onConflict: 'source_table,source_record_id', ignoreDuplicates: true },
    );
    if (error) {
      console.error('[hidden-records] hide:', error.message);
      return NextResponse.json({ error: 'Could not hide the record.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[hidden-records] POST error:', err);
    return NextResponse.json({ error: 'Could not hide the record.' }, { status: 500 });
  }
}

// GET /api/admin/hidden-records — list hidden records.
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const records = await getHiddenRecords();
  return NextResponse.json({ ok: true, records });
}

// DELETE /api/admin/hidden-records — restore (unhide) a record.
export async function DELETE(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = unhideRecordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .from('admin_hidden_records')
      .delete()
      .eq('source_table', parsed.data.sourceTable)
      .eq('source_record_id', parsed.data.sourceRecordId);
    if (error) {
      console.error('[hidden-records] restore:', error.message);
      return NextResponse.json({ error: 'Could not restore the record.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[hidden-records] DELETE error:', err);
    return NextResponse.json({ error: 'Could not restore the record.' }, { status: 500 });
  }
}
