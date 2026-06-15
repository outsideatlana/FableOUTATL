import { NextResponse } from 'next/server';
import { interestSchema, fieldErrors } from '@/lib/validation/schemas';
import { isAirtableConfigured } from '@/lib/airtable/client';
import { submitInterest } from '@/lib/airtable/sync';

/**
 * POST /api/interest — public "What should we throw next?" idea form.
 *
 * This form's ONLY destination is the Airtable INTEREST FORMS table. It is
 * intentionally NOT written to Supabase (Supabase backs photos, events,
 * recaps, and "Who We've Hosted" — not idea submissions).
 *
 * SECURITY: the Airtable write happens here, server-side; AIRTABLE_API_KEY
 * never reaches the browser.
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

    if (!isAirtableConfigured()) {
      return NextResponse.json(
        { error: 'Idea submissions are temporarily unavailable.' },
        { status: 503 },
      );
    }

    const data = parsed.data;
    try {
      await submitInterest({
        name: data.name,
        email: data.email,
        phone: data.phone,
        instagram: data.instagram,
        idea_title: data.idea_title,
        idea_description: data.idea_description,
        preferred_vibe: data.preferred_vibe,
        consent: data.consent,
      });
    } catch (err) {
      console.error('[interest] airtable submit failed:', err);
      return NextResponse.json({ error: 'Could not submit your idea. Try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[interest] error:', err);
    return NextResponse.json({ error: 'Could not submit your idea. Try again.' }, { status: 500 });
  }
}
