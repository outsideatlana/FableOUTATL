import Link from 'next/link';
import { getPublishedEvents, getPublicRecaps } from '@/lib/data/public';
import { EVENT_CONCEPTS, ARTIST_PROOF } from '@/lib/content';
import { Section } from '@/components/public/section';
import { EventCard } from '@/components/public/event-card';
import { ConceptCards } from '@/components/public/concept-cards';
import { RecapGallery } from '@/components/public/recap-gallery';
import { RsvpForm } from '@/components/forms/rsvp-form';
import { buttonClasses } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [events, recaps] = await Promise.all([getPublishedEvents(), getPublicRecaps()]);
  const upcoming = events.slice(0, 6);
  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(37,99,235,0.18),transparent)]" />
        <div className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-hot/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 md:py-36">
          <p className="mono-label">[ Atlanta / Live Music / Nightlife ]</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-8xl">
            The Sound of <span className="text-hot">Atlanta&apos;s</span> After-Hours
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Parties, festivals, concerts, raves, and pop-ups — made by the people who live it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className={buttonClasses('hot')}>
              Upcoming Shows
            </Link>
            <Link href="/dj" className={buttonClasses('outline')}>
              Artist Submission
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <Section
        id="events"
        eyebrow="[ 01 / Calendar ]"
        title="Upcoming Drops"
        action={
          <Link href="/events" className="font-mono text-xs uppercase tracking-[0.15em] text-electric-400 hover:text-white">
            All events →
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <div className="border border-line bg-ink-800 p-12 text-center">
            <p className="mono-label">[ Standby ]</p>
            <p className="mt-3 font-display text-2xl uppercase">Next drop loading.</p>
            <p className="mt-1 text-sm text-muted">Join the list below so you hear about it first.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </Section>

      {/* Concepts — gauge interest */}
      <Section
        id="concepts"
        eyebrow="[ 02 / Concepts ]"
        title="What Should We Throw Next?"
        className="border-t border-line"
      >
        <p className="mb-8 max-w-2xl text-muted">
          Tell us what you want to see. Enough interest and it goes on the calendar.
        </p>
        <ConceptCards concepts={EVENT_CONCEPTS} />
      </Section>

      {/* Recaps */}
      <Section id="recaps" eyebrow="[ 03 / Archive ]" title="Past Recaps" className="border-t border-line">
        <RecapGallery recaps={recaps} />
      </Section>

      {/* Artist / social proof */}
      <Section eyebrow="[ 04 / Proof ]" title="Who We've Hosted" className="border-t border-line">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ARTIST_PROOF.map((a) => (
            <div key={a.name} className="border border-line bg-ink-800 p-6">
              <p className="font-display text-xl uppercase">{a.name}</p>
              <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted">
                {a.note}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* RSVP / CRM */}
      <Section id="rsvp" className="border-t border-line">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="mono-label">[ 05 / Pre-RSVP ]</p>
            <h2 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
              Lock in your spot.
            </h2>
            <p className="mt-4 max-w-md text-muted">
              RSVP ahead and skip the line. We&apos;ll hit you with the details — and presale
              codes — before doors.
            </p>
          </div>
          <div className="border border-line bg-ink-800 p-6 md:p-8">
            <RsvpForm events={eventOptions} />
          </div>
        </div>
      </Section>
    </>
  );
}
