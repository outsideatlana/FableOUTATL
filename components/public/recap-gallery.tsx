import Image from 'next/image';
import type { RecapWithEvent } from '@/lib/data/public';
import { shortDate } from '@/lib/utils';

/** Past recaps gallery — Lovable grayscale square grid with hover overlay. */
export function RecapGallery({ recaps }: { recaps: RecapWithEvent[] }) {
  if (recaps.length === 0) {
    return (
      <div className="border border-dashed border-border p-16 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">[ Archive being built ]</p>
        <p className="mx-auto max-w-md text-muted-foreground">
          Photo + video recaps of past OutsideAtl events will live here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {recaps.map((r) => {
        const label = r.event_title || shortDate(r.created_at?.slice(0, 10) ?? null);
        return (
          <figure key={r.id} className="group relative aspect-square overflow-hidden bg-secondary">
            <Image
              src={r.image_url}
              alt={r.caption ?? r.event_title ?? 'Recap photo'}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
            />
            {(label || r.caption) && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                {label && <p className="font-mono text-[10px] uppercase text-red-600">{label}</p>}
                {r.caption && <p className="truncate font-display text-sm uppercase">{r.caption}</p>}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
