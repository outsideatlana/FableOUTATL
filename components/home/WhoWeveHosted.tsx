import Image from 'next/image';
import { getPublicHosted } from '@/lib/data/public';
import type { HostedRow } from '@/types/database';

/**
 * "Who We've Hosted" — loaded from Supabase (admin-managed), never
 * hardcoded. Renders only published entries; hides the whole section when
 * there are none (no fake/placeholder data).
 */
export async function WhoWeveHosted() {
  const hosted = await getPublicHosted();
  if (hosted.length === 0) return null;

  return (
    <section id="hosted" className="relative gradient-divider px-6 py-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ Proof ]</p>
      <h2 className="mb-12 font-display text-5xl uppercase tracking-tighter md:text-7xl">
        Who We&apos;ve Hosted
      </h2>
      <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
        {hosted.map((h) => (
          <HostedCard key={h.id} entry={h} />
        ))}
      </div>
    </section>
  );
}

function HostedCard({ entry }: { entry: HostedRow }) {
  const inner = (
    <>
      {entry.image_url ? (
        <div className="relative mb-4 aspect-[3/2] overflow-hidden bg-secondary">
          <Image
            src={entry.image_url}
            alt={entry.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain grayscale transition-all duration-500 group-hover:grayscale-0"
          />
        </div>
      ) : null}
      <p className="font-display text-2xl uppercase tracking-tight">{entry.name}</p>
      {entry.description && (
        <p className="mt-2 text-xs text-muted-foreground">{entry.description}</p>
      )}
    </>
  );

  const className = 'group block bg-background p-8';
  return entry.link_url ? (
    <a href={entry.link_url} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}
