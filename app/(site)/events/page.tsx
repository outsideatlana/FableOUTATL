import type { Metadata } from 'next';
import { getPublishedEvents } from '@/lib/data/public';
import { Section } from '@/components/public/section';
import { EventCard } from '@/components/public/event-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming OutsideAtl parties, festivals, concerts, raves, and pop-ups.',
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <Section eyebrow="[ Calendar ]" title="Upcoming Events">
      {events.length === 0 ? (
        <div className="border border-line bg-ink-800 p-12 text-center">
          <p className="mono-label">[ Calendar ]</p>
          <p className="mt-3 font-display text-2xl uppercase">No upcoming events posted yet.</p>
          <p className="mt-1 text-sm text-muted">Check back soon — or join the list on the homepage.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </Section>
  );
}
