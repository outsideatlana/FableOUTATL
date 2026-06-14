import Image from 'next/image';
import Link from 'next/link';
import type { EventRow } from '@/types/database';
import { EVENT_STATUS_META } from '@/types/events';
import { formatEventDate, shortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function EventCard({ event }: { event: EventRow }) {
  const status = EVENT_STATUS_META[event.status];
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block animate-fade-in border border-line bg-ink-800 transition-colors hover:border-white/30"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-700">
        {event.hero_image_url ? (
          <Image
            src={event.hero_image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <span className="font-display text-6xl uppercase leading-none text-hot">
              {shortDate(event.event_date)}
            </span>
            <span className="mono-label mt-4">{event.location ?? 'Atlanta'}</span>
          </div>
        )}
        <Badge className={`absolute left-3 top-3 bg-ink/80 ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      <div className="p-5">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-electric-400">
          {formatEventDate(event.event_date)}
        </p>
        <h3 className="mt-1 truncate font-display text-2xl uppercase tracking-tight">
          {event.title}
        </h3>
        {event.location && <p className="mt-1 text-sm text-muted">{event.location}</p>}
      </div>
    </Link>
  );
}
