import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { isAirtableEnabled } from '@/lib/airtable/client';

/**
 * GET /api/airtable/sync — admin: report whether Airtable mirroring is on.
 *
 * Form submissions write to Airtable on create (see lib/airtable/client.ts),
 * so there is nothing to push here; this endpoint reports the optional
 * events/recaps mirror status (ENABLE_AIRTABLE_SYNC) for the admin UI.
 */
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return NextResponse.json({ enabled: isAirtableEnabled() });
}
