import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { interestSchema, fieldErrors } from '@/lib/validation/schemas';
import { airtable } from '@/lib/airtable/sync';

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = interestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Sign-ups are temporarily unavailable.' },
        { status: 503 },
      );
    }

    const data = parsed.data;
    const { error } = await supabase.from('interest_signups').insert({
      concept_name: data.concept_name,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });
    if (error) {
      console.error('[interest] insert:', error.message);
      return NextResponse.json({ error: 'Could not save your sign-up. Try again.' }, { status: 500 });
    }

    await airtable.interest(data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[interest] error:', err);
    return NextResponse.json({ error: 'Could not save your sign-up. Try again.' }, { status: 500 });
  }
}
