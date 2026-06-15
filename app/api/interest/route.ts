import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { interestSchema, fieldErrors } from '@/lib/validation/schemas';
import { airtable } from '@/lib/airtable/sync';

/**
 * POST /api/interest — public "What should we throw next?" idea form.
 * Stores in Supabase (source of truth), then optionally mirrors to
 * Airtable when ENABLE_AIRTABLE_SYNC=true. Airtable keys stay server-side.
 */
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
      return NextResponse.json({ error: 'Submissions are temporarily unavailable.' }, { status: 503 });
    }

    const data = parsed.data;
    const { error } = await supabase.from('interest_signups').insert({
      // concept_name is NOT NULL — derive it from the idea title.
      concept_name: data.idea_title,
      name: data.name,
      email: data.email,
      phone: data.phone,
      instagram: data.instagram,
      idea_title: data.idea_title,
      idea_description: data.idea_description,
      preferred_vibe: data.preferred_vibe,
      consent: data.consent,
    });
    if (error) {
      console.error('[interest] insert:', error.message);
      return NextResponse.json({ error: 'Could not save your idea. Try again.' }, { status: 500 });
    }

    await airtable.interest({
      concept_name: data.idea_title,
      name: data.name,
      email: data.email,
      phone: data.phone,
      instagram: data.instagram,
      idea_description: data.idea_description,
      preferred_vibe: data.preferred_vibe,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[interest] error:', err);
    return NextResponse.json({ error: 'Could not save your idea. Try again.' }, { status: 500 });
  }
}
