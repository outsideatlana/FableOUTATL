import Link from 'next/link';
import type { EventRow } from '@/types/database';
import type { EventHeroView } from '@/lib/events/format-event-hero';
import { GeneratedEventPoster } from '@/components/events/generated-event-poster';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The featured / next-up event rendered as a flyer: a poster panel (real
 * uploaded image, or a generated title flyer when none exists) beside a details
 * panel with the date/doors/venue/price grid, lineup, and actions.
 *
 * All copy comes from real Supabase fields via `event` + the pre-formatted
 * `view`; optional fields are guarded and never fabricated.
 */
export function FeaturedEventHero({
  event,
  view,
  isFeatured,
}: {
  event: EventRow;
  view: EventHeroView;
  isFeatured: boolean;
}) {
  const eyebrow = isFeatured ? 'Now Showing' : 'Next Up';
  const lineup = Array.isArray(event.lineup) ? event.lineup.filter(Boolean) : [];
  const lineupStr = lineup.length > 0 ? lineup.join(' · ') : 'Lineup coming soon.';
  const priceStr = event.price_label?.trim() || 'Tickets coming soon.';
  const detailHref = `/events/${event.slug}`;
  const externalRsvp = !event.use_internal_rsvp && Boolean(event.rsvp_url);

  return (
    <section id="featured" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mono-label mb-6">[ {eyebrow} ]</p>

        <div className="grid items-stretch border border-line md:grid-cols-2">
          {/* ---- Poster panel ---- */}
          <div className="relative min-h-[22rem] overflow-hidden bg-ink-800">
            {event.hero_image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.hero_image_url}
                  alt={event.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Scrim so the overlaid labels stay legible. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"
                />
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-start justify-between font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/70">
                    <span>{event.category?.trim() || 'OutsideAtl'}</span>
                    <span>OutsideAtl</span>
                  </div>
                  <div>
                    {view.dateLabel && (
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-electric-400">
                        {view.dayLabel} · {view.dateLabel}
                      </p>
                    )}
                    <p className="mt-1 font-display text-3xl uppercase leading-[0.9] tracking-tight md:text-4xl">
                      {view.title}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <GeneratedEventPoster
                title={event.title}
                subtitle={event.subtitle}
                dateLabel={view.dateLabel}
                className="absolute inset-0"
              />
            )}
          </div>

          {/* ---- Details panel ---- */}
          <div className="flex flex-col gap-5 bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-electric px-2 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white">
                {isFeatured ? 'Featured' : 'Next Up'}
              </span>
              {event.age_restriction?.trim() && (
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted">
                  {event.age_restriction.trim()}
                </span>
              )}
            </div>

            <h2 className="font-display text-3xl uppercase leading-[0.92] tracking-tight md:text-5xl">
              {view.title}
            </h2>
            {event.subtitle?.trim() && (
              <p className="text-lg leading-relaxed text-muted-foreground">{event.subtitle.trim()}</p>
            )}

            {/* Facts grid — all from real fields, safe fallbacks. */}
            <dl className="grid grid-cols-2 gap-px border border-line bg-line">
              <Fact label="Date" value={view.dateLabel ?? 'Date TBA'} />
              <Fact label="Doors" value={view.timeStr} />
              <Fact label="Venue" value={view.locationLabel} />
              <Fact label="Price" value={priceStr} />
            </dl>

            <div>
              <p className="mono-label">[ Lineup ]</p>
              <p className="mt-2 text-muted-foreground">{lineupStr}</p>
            </div>

            <div className="mt-1 flex flex-wrap gap-3">
              {event.use_internal_rsvp ? (
                <Link href={detailHref} className={buttonClasses('accent')}>
                  Pre-RSVP →
                </Link>
              ) : externalRsvp ? (
                <a
                  href={event.rsvp_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses('accent')}
                >
                  RSVP →
                </a>
              ) : null}
              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses('hot')}
                >
                  Tickets →
                </a>
              )}
              <Link href={detailHref} className={buttonClasses('outline')}>
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('bg-card p-4')}>
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-sm uppercase tracking-[0.06em] text-white/90">{value}</dd>
    </div>
  );
}
