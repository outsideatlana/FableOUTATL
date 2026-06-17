import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { signupSchema, fieldErrors } from '@/lib/validation/schemas';
import { submitSignup, isAirtableConfigured } from '@/lib/airtable/client';

/**
 * POST /api/signups — public newsletter / join-the-list form. Saves to
 * Supabase `signups` (source of truth for admin), then submits to Airtable
 * Signups. Shared Airtable logic lives in lib/airtable/client.ts.
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

    if (isAirtableConfigured()) {
      try {
        await submitSignup({ email: data.email });
      } catch (err) {
        console.error('[signups] airtable submit failed (saved in Supabase):', err);
      }
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[signups] error:', err);
    return NextResponse.json({ error: 'Could not save your signup. Try again.' }, { status: 500 });
  }
}
