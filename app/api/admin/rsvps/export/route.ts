import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { getAdminRsvps } from '@/lib/data/admin';
import { toCsv } from '@/lib/utils';

// GET /api/admin/rsvps/export?event=<id> — admin: download RSVPs as CSV.
export async function GET(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event') || undefined;
  const rsvps = await getAdminRsvps(eventId);

  const csv = toCsv(
    ['Name', 'Email', 'Phone', 'Instagram', 'Event', 'Notes', 'Created'],
    rsvps.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.instagram,
      r.event_title,
      r.notes,
      r.created_at,
    ]),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rsvps-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
