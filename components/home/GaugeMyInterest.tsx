import { EVENT_CONCEPTS } from '@/lib/content';
import { ConceptCards } from '@/components/public/concept-cards';

/**
 * "Gauge My Interest" — PRESERVED AI-built section. Keeps its concept
 * cards (EVENT_CONCEPTS) and submission flow (/api/interest → Supabase +
 * optional Airtable). Styling matches the Lovable design; content/logic
 * are unchanged. Isolated here so the rest of the homepage can be restyled
 * without touching this feature.
 */
export function GaugeMyInterest() {
  return (
    <section id="gauge" className="relative gradient-divider px-6 py-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Gauge My Interest ]</p>
      <h2 className="font-display text-5xl uppercase tracking-tighter md:text-7xl">
        What Should We
        <br />
        Throw Next?
      </h2>
      <p className="mb-12 mt-6 max-w-2xl text-muted-foreground">
        Tell us what you want to see. Enough interest and it goes on the calendar.
      </p>
      <ConceptCards concepts={EVENT_CONCEPTS} />
    </section>
  );
}
