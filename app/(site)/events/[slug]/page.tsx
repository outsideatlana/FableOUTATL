import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventBySlug, getPublishedEvents } from '@/lib/data/public';
import { getAnyEventBySlug } from '@/lib/data/admin';
import { getSession } from '@/lib/auth/admin';
import { EVENT_STATUS_META } from '@/types/events';
import { formatEventDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { RsvpForm } from '@/components/forms/rsvp-form';
import { AnimatedEventBackground } from '@/components/ui/animated-event-background';
import { GeneratedEventPoster } from '@/components/events/generated-event-poster';
import type { EventRow } from '@/types/database';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Event not found' };
  return {
    title: event.seo_title?.trim() || event.title,
    description: event.seo_description?.trim() || event.description || undefined,
  };
}

/** Time line from the free-text start/end fields. */
function timeLine(event: EventRow): string | null {
  const start = event.start_time?.trim();
  const end = event.end_time?.trim();
  if (start && end) return `${start} – ${end}`;
  return start || end || null;
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  // Public visitors only ever see published / sold-out events. An authenticated
  // admin may preview any status (draft, archived) via the same URL.
  const session = await getSession();
  const event = session ? await getAnyEventBySlug(slug) : await getEventBySlug(slug);
  if (!event) notFound();

  const publiclyVisible = event.status === 'published' || event.status === 'sold_out';
  const isPreview = Boolean(session) && !publiclyVisible;

  const status = EVENT_STATUS_META[event.status];
  const events = await getPublishedEvents();
  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }));
  const soldOut = event.status === 'sold_out';

  const lineup = Array.isArray(event.lineup) ? event.lineup.filter(Boolean) : [];
  const venue = event.venue_name?.trim() || event.location?.trim() || null;
  const time = timeLine(event);
  const hasTickets = Boolean(event.ticket_url) || Boolean(event.price_label);
  const externalRsvp = !event.use_internal_rsvp && Boolean(event.rsvp_url);

  return (
    <article>
      {isPreview && (
        <div className="bg-hot px-5 py-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white">
          Admin preview · status: {status.label} · not visible to the public
        </div>
      )}
      {/* ---- Animated hero with the poster centered like a featured flyer ---- */}
      <section className="relative overflow-hidden gradient-divider px-5 pb-16 pt-12 md:pb-24 md:pt-16">
        <AnimatedEventBackground />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <Link
            href="/events"
            className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
          >
            ← All events
          </Link>

          {/* Poster card */}
          <div className="mx-auto mt-8 w-full max-w-sm">
            <div className="relative border border-line bg-ink-800 shadow-[0_0_70px_hsl(220_90%_40%/0.35)] ring-1 ring-electric/20">
              {event.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.hero_image_url}
                  alt={event.title}
                  className="block h-auto max-h-[68vh] w-full object-contain"
                />
              ) : (
                <div className="aspect-[4/5] w-full">
                  <GeneratedEventPoster
                    title={event.title}
                    subtitle={event.subtitle}
                    dateLabel={formatEventDate(event.event_date)}
                  />
                </div>
              )}
              <Badge className={`absolute left-3 top-3 bg-ink/80 ${status.className}`}>
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Title block */}
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-electric-400">
              {event.category?.trim() || formatEventDate(event.event_date)}
            </p>
            <h1 className="mt-3 text-balance font-display text-4xl uppercase leading-[0.9] tracking-tight md:text-6xl">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-4 text-lg text-white/80">{event.subtitle}</p>
            )}
          </div>
        </div>
      </section>

      {/* ---- Details + RSVP aside ---- */}
      <div className="mx-auto max-w-5xl px-5 pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          {/* Main column */}
          <div className="space-y-8">
            {/* Facts */}
            <dl className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
              <Fact label="Date" value={formatEventDate(event.event_date)} />
              {time && <Fact label="Time" value={time} />}
              <Fact label="Venue" value={venue ?? 'Venue to be announced.'} />
              {(event.venue_address || event.city_state) && (
                <Fact
                  label="Address"
                  value={[event.venue_address, event.city_state].filter(Boolean).join(', ')}
                />
              )}
              {event.age_restriction && <Fact label="Ages" value={event.age_restriction} />}
              {event.price_label && <Fact label="Price" value={event.price_label} />}
            </dl>

            {/* Description */}
            <div>
              <p className="mono-label">[ About ]</p>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-white/90">
                {event.description?.trim() || 'Event details coming soon.'}
              </p>
            </div>

            {/* Lineup */}
            <div>
              <p className="mono-label">[ Lineup ]</p>
              {lineup.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {lineup.map((artist, i) => (
                    <li
                      key={`${artist}-${i}`}
                      className="border border-line bg-ink-800 px-3 py-2 font-display text-lg uppercase tracking-tight"
                    >
                      {artist}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-muted-foreground">Lineup coming soon.</p>
              )}
            </div>
          </div>

          {/* Aside */}
          <aside className="space-y-4 border border-line bg-ink-800 p-6 lg:sticky lg:top-24">
            <p className="mono-label">[ {soldOut ? 'Sold Out' : 'Attend'} ]</p>

            {hasTickets && (
              <div className="space-y-2 border-b border-line pb-4">
                {event.price_label && (
                  <p className="font-display text-3xl uppercase">{event.price_label}</p>
                )}
                {event.ticket_url ? (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClasses('hot')} w-full`}
                  >
                    Get Tickets
                  </a>
                ) : (
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Tickets coming soon.
                  </p>
                )}
              </div>
            )}

            {/* RSVP — internal form, external link, or neutral fallback */}
            {event.use_internal_rsvp ? (
              <div>
                <h2 className="font-display text-2xl uppercase">
                  {soldOut ? 'Join the waitlist' : 'Reserve your spot'}
                </h2>
                <div className="mt-4">
                  <RsvpForm events={eventOptions} defaultEventId={event.id} />
                </div>
              </div>
            ) : externalRsvp ? (
              <a
                href={event.rsvp_url!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClasses('accent')} w-full`}
              >
                {soldOut ? 'Join the waitlist' : 'RSVP'}
              </a>
            ) : (
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                RSVP coming soon.
              </p>
            )}

            {/* Optional call-to-action */}
            {event.cta_url && event.cta_text && (
              <a
                href={event.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClasses('outline')} w-full`}
              >
                {event.cta_text}
              </a>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-800 p-4">
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white/90">{value}</dd>
    </div>
  );
}
