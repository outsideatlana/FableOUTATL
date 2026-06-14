import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { isAirtableEnabled } from '@/lib/airtable/client';

/**
 * GET /api/airtable/sync — admin: report whether Airtable mirroring is on.
 *
 * Submissions auto-mirror to Airtable on create (see lib/airtable/sync.ts),
 * so there is nothing to push here; this endpoint exists for the admin UI
 * to display sync status and confirm credentials are wired up.
 */
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return NextResponse.json({ enabled: isAirtableEnabled() });
}
