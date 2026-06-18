import 'server-only';
import { NextResponse } from 'next/server';
import { sponsorApplicationSchema, fieldErrors } from '@/lib/validation/schemas';
import { submitSponsorApplication, isAirtableConfigured } from '@/lib/airtable/client';

/**
 * POST /api/applications/sponsors → Airtable Sponsors ONLY.
 *
 * Dedicated handler (NOT the shared role-application route): sponsors collect
 * brand-specific fields and must never land in the Vendors table or a Supabase
 * mirror. Submission goes through the centralized server-only Airtable helper,
 * so AIRTABLE_API_KEY never reaches the browser.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = sponsorApplicationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    if (!isAirtableConfigured()) {
      return NextResponse.json(
        { error: 'Sponsor applications are temporarily unavailable.' },
        { status: 503 },
      );
    }

    try {
      await submitSponsorApplication(parsed.data);
    } catch (err) {
      console.error('[applications:sponsors] airtable submit failed:', err);
      return NextResponse.json(
        { error: 'Could not submit your application. Try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[applications:sponsors] error:', err);
    return NextResponse.json(
      { error: 'Could not submit your application. Try again.' },
      { status: 500 },
    );
  }
}
