import { ARTIST_PROOF } from '@/lib/content';

/**
 * "Who We've Hosted" — PRESERVED AI-built section. Keeps its entries
 * (ARTIST_PROOF) and stays visible on every breakpoint (grid-cols-2 on
 * mobile). Styling matches the Lovable design; content is unchanged.
 */
export function WhoWeveHosted() {
  return (
    <section id="hosted" className="relative gradient-divider px-6 py-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Proof ]</p>
      <h2 className="mb-12 font-display text-5xl uppercase tracking-tighter md:text-7xl">
        Who We&apos;ve Hosted
      </h2>
      <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
        {ARTIST_PROOF.map((a) => (
          <div key={a.name} className="bg-background p-8">
            <p className="font-display text-2xl uppercase tracking-tight">{a.name}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {a.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
