import { getAdminEvents } from '@/lib/data/admin';
import { EventManager } from '@/components/admin/event-manager';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const events = await getAdminEvents();
  return (
    <div>
      <p className="mono-label">[ Event Management ]</p>
      <h1 className="mb-6 mt-1 font-display text-4xl uppercase tracking-tight">Events</h1>
      <EventManager initialEvents={events} />
    </div>
  );
}
