import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { signupSchema, fieldErrors } from '@/lib/validation/schemas';
import { airtable } from '@/lib/airtable/sync';

/**
 * POST /api/signups — public newsletter / signup form. Saves to Supabase
 * `signups` (source of truth), then optionally mirrors to Airtable SIGNUPS.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = signupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Sign-ups are temporarily unavailable.' }, { status: 503 });
    }

    const data = parsed.data;
    const { error } = await supabase.from('signups').insert({
      email: data.email,
      phone: data.phone,
    });
    if (error) {
      console.error('[signups] insert:', error.message);
      return NextResponse.json({ error: 'Could not save your signup. Try again.' }, { status: 500 });
    }

    await airtable.signup({ email: data.email, phone: data.phone });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[signups] error:', err);
    return NextResponse.json({ error: 'Could not save your signup. Try again.' }, { status: 500 });
  }
}
