import { getAdminRsvps, getAdminEventOptions } from '@/lib/data/admin';
import { RsvpTable } from '@/components/admin/rsvp-table';

export const dynamic = 'force-dynamic';

export default async function AdminRsvpsPage() {
  const [rsvps, eventOptions] = await Promise.all([
    getAdminRsvps(),
    getAdminEventOptions(),
  ]);
  return (
    <div>
      <p className="mono-label">[ RSVP Management ]</p>
      <h1 className="mb-6 mt-1 font-display text-4xl uppercase tracking-tight">RSVPs</h1>
      <RsvpTable rsvps={rsvps} eventOptions={eventOptions} />
    </div>
  );
}
