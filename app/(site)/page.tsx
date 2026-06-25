import Link from 'next/link';
import { getPublishedEvents, getPublicRecaps, getFeaturedEvent } from '@/lib/data/public';
import { RsvpForm } from '@/components/forms/rsvp-form';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import { EventsSection } from '@/components/home/events-section';
import { RecapsSection } from '@/components/home/recaps-section';
import { GaugeInterestForm } from '@/components/home/gauge-interest-form';
import { WhoWeveHosted } from '@/components/home/who-weve-hosted';
import { AnimatedEventBackground } from '@/components/ui/animated-event-background';
import { GeneratedEventPoster } from '@/components/events/generated-event-poster';
import { shortDate, formatEventDate } from '@/lib/utils';
import type { EventRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [events, recaps, featured] = await Promise.all([
    getPublishedEvents(),
    getPublicRecaps(),
    getFeaturedEvent(),
  ]);
  const upcoming = events.slice(0, 6);
  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }));

  return (
    <>
      <Hero featured={featured} />
      <Ticker events={upcoming} />
      <EventsSection events={upcoming} />
      {/*
        Canonical "Gauge My Interest" FORM section. Do NOT swap this back to the
        old concept-card grid — see components/home/gauge-interest-form.tsx.
      */}
      <GaugeInterestForm />
      <WhoWeveHosted />
      <RecapsSection recaps={recaps} />
      <ApplicationHub />
      <RsvpSection eventOptions={eventOptions} />
      <AboutSection />
      <NewsletterSection />
      <ContactSection />
    </>
  );
}

function Hero({ featured }: { featured: EventRow | null }) {
  return (
    <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden gradient-divider px-6 pb-20">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      <AnimatedEventBackground />
      <div className="relative z-10 grid w-full animate-slide-up items-end gap-12 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="max-w-2xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-red-600">
            [ Atlanta / Live Music / Nightlife ]
          </p>
          <h1
            className="text-balance font-display text-[clamp(3.5rem,11vw,9rem)] uppercase leading-[0.85] tracking-tighter"
            style={{ textShadow: '0 0 80px hsl(220 90% 40% / 0.4)' }}
          >
            The Sound of <span className="text-red-600">Atlanta&apos;s</span>
            <br />
            After-Hours
          </h1>
          <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            We curate high-energy social experiences — from hidden warehouse raves to sun-drenched
            day parties. Building the next era of Atlanta&apos;s nightlife culture.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#events"
              className="bg-accent px-8 py-4 font-display text-xl uppercase tracking-tight text-accent-foreground shadow-[0_0_40px_hsl(220_90%_40%/0.5)] transition-transform hover:scale-105"
            >
              Upcoming Shows
            </a>
            <Link
              href="/dj"
              className="border border-foreground/30 px-8 py-4 font-display text-xl uppercase tracking-tight backdrop-blur-md transition-all hover:bg-foreground hover:text-background"
            >
              Artist Submission
            </Link>
          </div>
        </div>

        {featured && <FeaturedFlyer event={featured} />}
      </div>
    </section>
  );
}

/** Real featured event surfaced as a flyer in the hero. Never shown when no
 *  event is featured — the hero stays neutral rather than inventing one. */
function FeaturedFlyer({ event }: { event: EventRow }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group mx-auto w-full max-w-xs border border-line bg-ink-800 shadow-[0_0_60px_hsl(220_90%_40%/0.3)] ring-1 ring-electric/20 transition-transform hover:scale-[1.02] lg:mx-0 lg:ml-auto"
    >
      <span className="block bg-electric px-3 py-1 text-center font-mono text-[0.6rem] uppercase tracking-[0.25em] text-white">
        Featured
      </span>
      <div className="aspect-[4/5] w-full overflow-hidden">
        {event.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.hero_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <GeneratedEventPoster title={event.title} subtitle={event.subtitle} />
        )}
      </div>
      <div className="p-4">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-electric-400">
          {formatEventDate(event.event_date)}
        </p>
        <h3 className="mt-1 truncate font-display text-xl uppercase tracking-tight">
          {event.title}
        </h3>
        <span className="mt-2 inline-block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent">
          View event →
        </span>
      </div>
    </Link>
  );
}

function Ticker({ events }: { events: EventRow[] }) {
  const items =
    events.length > 0
      ? events.map((e) => `${shortDate(e.event_date)} — ${e.title.toUpperCase()}`)
      : ['NEW EVENTS DROPPING SOON', 'FOLLOW @OUTSID3.ATL FOR UPDATES', 'BOOKINGS OPEN', 'VENDOR APPS OPEN'];
  const loop = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-accent bg-accent py-3 text-accent-foreground">
      <div className="flex animate-marquee whitespace-nowrap font-mono text-sm font-bold uppercase">
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-6 px-6">
            {t}
            <span className="opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ApplicationHub() {
  const tracks = [
    { href: '/apply/intern', num: '01', cat: 'Internships', title: 'Next Gen', desc: 'Marketing, content, ops, social media, photo, video, artist relations — for students and early-career talent.', cta: 'Apply Now' },
    { href: '/apply/freelancer', num: '02', cat: 'Creative', title: 'Freelance Crew', desc: 'Photography, videography, design, editing, street team, event staff, security, production. Build with us.', cta: 'Join the Roster' },
    { href: '/apply/vendor', num: '03', cat: 'Partnership', title: 'Vendors', desc: 'Food, drink, clothing, merch, local brands, pop-up shops, sponsors. Activate at our next event.', cta: 'Pitch Us' },
    { href: '/dj', num: '04', cat: 'Talent', title: 'DJs & Artists', desc: 'Submit your sound. Booking opportunities, showcases, collabs, and future lineups.', cta: 'Submit Music' },
  ];
  return (
    <section id="apply" className="relative gradient-divider bg-foreground px-6 py-24 text-background">
      <div className="max-w-5xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-background/60">[ 02 / Work With Us ]</p>
        <h2 className="mb-4 font-display text-5xl uppercase leading-none tracking-tighter md:text-7xl">
          Build the Scene
          <br />
          With Us
        </h2>
        <p className="mb-16 max-w-2xl text-lg opacity-70">
          OutsideAtl is community-driven. Whether you&apos;re behind the decks, behind the lens, or
          behind a brand. We want to hear from you.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tracks.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="block border border-background/20 p-8 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="mb-8 block font-mono text-xs uppercase">[ {t.num} / {t.cat} ]</span>
              <h4 className="mb-4 font-display text-4xl uppercase">{t.title}</h4>
              <p className="mb-8 text-sm opacity-80">{t.desc}</p>
              <span className="text-xs font-bold uppercase tracking-widest">{t.cta} →</span>
            </Link>
          ))}
          <Link
            href="/apply/sponsors"
            className="block border border-accent/60 bg-accent/10 p-8 transition-colors hover:bg-accent hover:text-accent-foreground md:col-span-2"
          >
            <span className="mb-8 block font-mono text-xs uppercase">[ 05 / Sponsors &amp; Partners ]</span>
            <h4 className="mb-4 font-display text-4xl uppercase">Partner With OutsideAtl</h4>
            <p className="mb-8 text-sm opacity-80">
              Sponsorship packages, brand activations, in-kind partners, media collabs. Pitch a
              custom ask.
            </p>
            <span className="text-xs font-bold uppercase tracking-widest">Partner With Us →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function RsvpSection({ eventOptions }: { eventOptions: { id: string; title: string }[] }) {
  return (
    <section id="rsvp" className="relative gradient-divider bg-secondary/60 px-6 py-24 backdrop-blur-sm">
      <div className="grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ 04 / Pre-RSVP ]</p>
          <h2 className="mb-6 font-display text-5xl uppercase tracking-tighter md:text-6xl">Lock in your spot.</h2>
          <p className="mb-6 text-muted-foreground">
            Drop your info to pre-RSVP for upcoming OutsideAtl events. Early-access drops, secret
            locations, and community-only invites go to this list first.
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">[ Free to join. Always. ]</p>
        </div>
        <RsvpForm events={eventOptions} />
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="border-b border-border px-6 py-24">
      <div className="max-w-4xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ 05 / About ]</p>
        <h2 className="mb-8 font-display text-5xl uppercase tracking-tighter md:text-7xl">
          More than
          <br />
          an event.
        </h2>
        <p className="mb-6 text-xl leading-relaxed text-muted-foreground">
          OutsideAtl plans, promotes, and produces high-energy social experiences across Atlanta —
          parties, festivals, concerts, pop-ups, raves, DJ nights, and artist-focused events.
        </p>
        <p className="text-lg leading-relaxed text-muted-foreground">
          We&apos;re made in Atlanta&apos;s live music, nightlife, college, and youth culture
          scene and we partner with venues, sponsors, brands, vendors, and artists to build the
          city&apos;s best nightlive experience.
        </p>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="flex flex-col items-center px-6 py-24 text-center">
      <div className="max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Newsletter ]</p>
        <h2 className="mb-6 font-display text-5xl uppercase tracking-tight">Don&apos;t Miss the Next Wave</h2>
        <p className="mb-10 text-muted-foreground">
          First drops, secret locations, and community invites straight to your inbox.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section
      id="contact"
      className="flex flex-col items-center border-t border-border px-6 py-24 text-center"
    >
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Contact ]</p>
      <h2 className="mb-6 font-display text-5xl uppercase tracking-tight md:text-7xl">
        Get In Touch
      </h2>
      <p className="mb-10 max-w-xl text-muted-foreground">
        For bookings, partnerships, sponsorships, and general inquiries.
      </p>
      <a
        href="mailto:contact@outsideatl.co"
        className="font-display text-2xl uppercase tracking-tight underline underline-offset-8 transition-colors hover:text-accent md:text-4xl"
      >
        contact@outsideatl.co
      </a>
    </section>
  );
}
