import { InterestForm } from '@/components/forms/interest-form';

/**
 * "What should we throw next?" — PRESERVED AI-built section, now an idea
 * submission form. Posts to /api/interest (Supabase + optional Airtable).
 * Styling matches the Lovable design.
 */
export function GaugeMyInterest() {
  return (
    <section id="gauge" className="relative gradient-divider bg-secondary/60 px-6 py-24 backdrop-blur-sm">
      <div className="grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Gauge My Interest ]</p>
          <h2 className="mb-6 font-display text-5xl uppercase tracking-tighter md:text-6xl">
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
