import { EventCard } from '@/components/public/event-card';
import type { EventRow } from '@/types/database';

/**
 * Homepage "Upcoming Drops" section. Events come from Supabase (published
 * only) via the homepage loader. Shows an empty state when nothing is live.
 */
export function EventsSection({ events }: { events: EventRow[] }) {
  return (
    <section id="events" className="relative gradient-divider px-6 py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ 01 / Calendar ]</p>
          <h2 className="font-display text-5xl uppercase tracking-tighter md:text-7xl">
            Upcoming
            <br />
            Drops
          </h2>
        </div>
        <a href="#rsvp" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
          [ Pre-RSVP → ]
        </a>
      </div>

      {events.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">[ Calendar ]</p>
          <p className="mb-6 font-display text-3xl uppercase">No upcoming events posted yet.</p>
          <p className="mx-auto max-w-md text-muted-foreground">Join the list below to be the first to know when tickets go live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}
