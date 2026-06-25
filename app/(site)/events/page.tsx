import type { Metadata } from 'next';
import { getPublishedEvents, getFeaturedEvent } from '@/lib/data/public';
import { formatEventHero } from '@/lib/events/format-event-hero';
import { AnimatedEventBackground } from '@/components/ui/animated-event-background';
import { EventMarquee } from '@/components/events/event-marquee';
import { FeaturedEventHero } from '@/components/events/featured-event-hero';
import { EventCard } from '@/components/public/event-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'See upcoming OutsideAtl events, parties, concerts, raves, and nightlife experiences.',
};

export default async function EventsPage() {
  // Real Supabase data only. Both calls tolerate a missing/misconfigured
  // backend and return safe empties, so the page always renders.
  const [events, featured] = await Promise.all([getPublishedEvents(), getFeaturedEvent()]);

  // Featured/current event priority: explicit featured → next upcoming → none.
  const featuredEvent = featured ?? events[0] ?? null;
  const isFeatured = Boolean(featured);

  // Marquee state mirrors that priority.
  const marqueeText = featured
    ? `NOW SHOWING: ${featured.title}`
    : events[0]
      ? `NEXT UP: ${events[0].title}`
      : 'NO UPCOMING EVENTS POSTED YET';

  // Grid shows every other published event (the featured one headlines above).
  const gridEvents = featuredEvent
    ? events.filter((e) => e.id !== featuredEvent.id)
    : events;

  const heroView = featuredEvent ? formatEventHero(featuredEvent) : null;

  return (
    <>
      {/* ===== Festival-lineup hero ===== */}
      <section className="relative flex min-h-[86vh] flex-col items-center justify-center overflow-hidden gradient-divider px-6 py-24 text-center">
        <AnimatedEventBackground />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/30 via-background/55 to-background" />

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          {featuredEvent && heroView ? (
            <>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-red-600">
                {heroView.presents}
              </p>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {heroView.timeStr}
              </p>
              <h1
                className="font-display text-[clamp(2.4rem,7.2vw,5.6rem)] uppercase leading-[0.9] tracking-tight"
                style={{ textShadow: '0 0 80px hsl(220 90% 40% / 0.4)' }}
              >
                {heroView.title}
              </h1>

              <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-2">
                <p className="font-display text-[clamp(1.4rem,4vw,2.5rem)] uppercase leading-none tracking-tight">
                  {heroView.headliner}
                </p>
                {heroView.mainStr && (
                  <p className="font-display text-[clamp(1rem,2.6vw,1.6rem)] uppercase leading-tight text-muted-foreground">
                    {heroView.mainStr}
                  </p>
                )}
                {heroView.supportStr && (
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                    {heroView.supportStr}
                  </p>
                )}
              </div>

              <p className="mt-8 inline-block bg-red-600 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
                {heroView.dayDateLocation}
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <a
                  href="#featured"
                  className="bg-accent px-8 py-4 font-display text-xl uppercase tracking-tight text-accent-foreground shadow-[0_0_40px_hsl(220_90%_40%/0.5)] transition-transform hover:scale-105"
                >
                  Lock In Your Spot →
                </a>
                <a
                  href="#upcoming"
                  className="border border-foreground/30 px-8 py-4 font-display text-xl uppercase tracking-tight backdrop-blur-md transition-colors hover:bg-foreground hover:text-background"
                >
                  Full Calendar
                </a>
              </div>
            </>
          ) : (
            // Empty state — never an invented event.
            <>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-red-600">
                OutsideAtl Presents
              </p>
              <h1
                className="font-display text-[clamp(2.4rem,7.2vw,5.6rem)] uppercase leading-[0.9] tracking-tight"
                style={{ textShadow: '0 0 80px hsl(220 90% 40% / 0.4)' }}
              >
                Atlanta&apos;s
                <br />
                <span className="text-red-600">After-Hours</span>
              </h1>
              <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
                No upcoming events posted yet — check back soon for the next OutsideAtl event.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ===== Marquee header ===== */}
      <EventMarquee text={marqueeText} />

      {/* ===== Featured event / empty state ===== */}
      {featuredEvent && heroView ? (
        <FeaturedEventHero event={featuredEvent} view={heroView} isFeatured={isFeatured} />
      ) : (
        <section className="px-6 py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 border border-line bg-card p-12 text-center">
            <p className="mono-label">[ Calendar ]</p>
            <h2 className="font-display text-3xl uppercase leading-[0.9] tracking-tight md:text-5xl">
              No upcoming events posted yet
            </h2>
            <p className="max-w-md text-muted-foreground">
              Check back soon for the next OutsideAtl event.
            </p>
          </div>
        </section>
      )}

      {/* ===== Upcoming grid ===== */}
      {gridEvents.length > 0 && (
        <section id="upcoming" className="px-6 pb-24">
          <div className="mx-auto max-w-6xl">
            <p className="mono-label mb-3">[ 01 / Calendar ]</p>
            <h2 className="mb-8 font-display text-4xl uppercase tracking-tight md:text-5xl">
              Upcoming Events
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {gridEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
