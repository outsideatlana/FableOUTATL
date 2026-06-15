import Image from 'next/image';
import type { RecapWithEvent } from '@/lib/data/public';

export function RecapGallery({ recaps }: { recaps: RecapWithEvent[] }) {
  if (recaps.length === 0) {
    return (
      <div className="border border-line bg-ink-800 p-12 text-center">
        <p className="mono-label">[ Standby ]</p>
        <p className="mt-3 font-display text-2xl uppercase">The archive starts soon.</p>
        <p className="mt-1 text-sm text-muted">Recaps land here after each drop.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {recaps.map((r) => (
        <figure key={r.id} className="group relative aspect-square overflow-hidden bg-ink-700">
          <Image
            src={r.image_url}
            alt={r.caption ?? r.event_title ?? 'Recap photo'}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {(r.event_title || r.caption) && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 to-transparent p-3">
              {r.event_title && (
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-hot-400">
                  {r.event_title}
                </p>
              )}
              {r.caption && (
                <p className="truncate font-display text-sm uppercase">{r.caption}</p>
              )}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
