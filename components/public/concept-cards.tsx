'use client';

import { useState } from 'react';
import type { EventConcept } from '@/types/events';
import { InterestForm } from '@/components/forms/interest-form';

/**
 * "Gauge My Interest" concept cards — PRESERVED content + logic. Each card
 * reveals the interest form (posts to /api/interest). Restyled to Lovable.
 */
export function ConceptCards({ concepts }: { concepts: EventConcept[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {concepts.map((c, i) => {
        const isOpen = active === c.name;
        return (
          <div
            key={c.name}
            className={`border p-8 transition-colors ${
              isOpen ? 'border-accent/60 bg-accent/10' : 'border-border hover:border-accent'
            }`}
          >
            <span className="mb-6 block font-mono text-xs uppercase text-red-600">
              [ {String(i + 1).padStart(2, '0')} ]
            </span>
            <h4 className="font-display text-3xl uppercase tracking-tight">{c.name}</h4>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-red-600">{c.tagline}</p>
            <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>

            {isOpen ? (
              <InterestForm concept={c.name} />
            ) : (
              <button
                type="button"
                onClick={() => setActive(c.name)}
                className="mt-6 font-bold uppercase tracking-widest text-xs transition-colors hover:text-accent"
              >
                Gauge My Interest →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
