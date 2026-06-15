import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getEventBySlug, getPublishedEvents } from '@/lib/data/public';
import { EVENT_STATUS_META } from '@/types/events';
import { formatEventDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RsvpForm } from '@/components/forms/rsvp-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Event not found' };
  return {
    title: event.title,
    description: event.description ?? undefined,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const status = EVENT_STATUS_META[event.status];
  const events = await getPublishedEvents();
  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }));
  const soldOut = event.status === 'sold_out';

  return (
    <article className="mx-auto max-w-5xl px-5 py-12 md:py-20">
      <div className="relative aspect-[16/9] overflow-hidden border border-line bg-ink-700">
        {event.hero_image_url ? (
          <Image
            src={event.hero_image_url}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl uppercase text-hot">OutsideAtl</span>
          </div>
        )}
        <Badge className={`absolute left-4 top-4 bg-ink/80 ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-400">
            {formatEventDate(event.event_date)}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-6xl">
            {event.title}
          </h1>
          {event.location && <p className="mt-3 text-muted">{event.location}</p>}
          {event.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-white/90">
              {event.description}
            </p>
          )}
        </div>

        <aside className="border border-line bg-ink-800 p-6">
          <p className="mono-label">[ {soldOut ? 'Sold Out' : 'Pre-RSVP'} ]</p>
          <h2 className="mt-2 font-display text-2xl uppercase">
            {soldOut ? 'Join the waitlist' : 'Reserve your spot'}
          </h2>
          <div className="mt-4">
            <RsvpForm events={eventOptions} defaultEventId={event.id} />
          </div>
        </aside>
      </div>
    </article>
  );
}
