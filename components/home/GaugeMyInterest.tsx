import { InterestForm } from '@/components/forms/interest-form';

/**
 * "What should we throw next?" — the Gauge My Interest section. An idea
 * submission form (left: pitch copy, right: the form). Submits via the
 * server route /api/interest to the Airtable INTEREST FORMS table; nothing
 * is written to Supabase. Styling matches the dark OutsideAtl/Lovable look.
 */
export function GaugeMyInterest() {
  return (
    <section id="gauge" className="relative gradient-divider bg-secondary/60 px-6 py-24 backdrop-blur-sm">
      <div className="grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Gauge My Interest ]</p>
          <h2 className="mb-6 font-display text-5xl uppercase tracking-tighter md:text-7xl">
            What Should We
            <br />
            Throw Next?
          </h2>
          <p className="text-muted-foreground">
            Pitch the party. Drop your idea — venue, sound, crowd, the whole vibe — and if enough
            people want it, we&apos;ll put it on the calendar.
          </p>
        </div>
        <InterestForm />
      </div>
    </section>
  );
}
