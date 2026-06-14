'use client';

import { useState } from 'react';
import type { EventConcept } from '@/types/events';
import { InterestForm } from '@/components/forms/interest-form';
import { cn } from '@/lib/utils';

export function ConceptCards({ concepts }: { concepts: EventConcept[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {concepts.map((c, i) => {
        const isOpen = active === c.name;
        return (
          <div
            key={c.name}
            className={cn(
              'border bg-ink-800 p-6 transition-colors',
              isOpen ? 'border-electric/50' : 'border-line hover:border-white/30',
            )}
          >
            <span className="mono-label">[ {String(i + 1).padStart(2, '0')} ]</span>
            <h3 className="mt-3 font-display text-2xl uppercase tracking-tight">{c.name}</h3>
            <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-hot-400">
              {c.tagline}
            </p>
            <p className="mt-3 text-sm text-muted">{c.description}</p>

            {isOpen ? (
              <InterestForm concept={c.name} />
            ) : (
              <button
                type="button"
                onClick={() => setActive(c.name)}
                className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-electric-400 hover:text-white"
              >
                Gauge my interest →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
