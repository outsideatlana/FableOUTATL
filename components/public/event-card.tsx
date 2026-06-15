import Image from 'next/image';
import Link from 'next/link';
import type { EventRow } from '@/types/database';
import { formatEventDate, shortDate } from '@/lib/utils';

/**
 * Event card — Lovable design: grayscale poster that colorizes + zooms on
 * hover, red date label, blue arrow affordance. Falls back to a big red
 * date + venue when there's no hero image. Links to the event detail page.
 */
export function EventCard({ event }: { event: EventRow }) {
  return (
    <Link href={`/events/${event.slug}`} className="group block bg-background p-6">
      <div className="relative mb-6 aspect-[4/5] overflow-hidden bg-secondary">
        {event.hero_image_url ? (
          <Image
            src={event.hero_image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <span className="font-display text-6xl uppercase leading-none text-red-600">
              {shortDate(event.event_date)}
            </span>
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {event.location ?? 'Atlanta'}
            </span>
          </div>
        )}
        {event.status === 'sold_out' && (
          <div className="absolute left-4 top-4 bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase text-accent-foreground">
            Sold Out
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[10px] uppercase text-red-600">{formatEventDate(event.event_date)}</p>
          <h3 className="truncate font-display text-2xl uppercase tracking-tight">{event.title}</h3>
          {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
        </div>
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center border border-border transition-colors group-hover:bg-accent group-hover:text-accent-foreground"
        >
          →
        </span>
      </div>

      {event.description && (
        <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
      )}
    </Link>
  );
}
