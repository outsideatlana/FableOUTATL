import Link from 'next/link';
import type { ApplicationType } from '@/types/database';
import { APPLICATION_TYPES, APPLICATION_TYPE_META } from '@/types/applications';
import { Section } from '@/components/public/section';
import { ApplicationForm } from '@/components/forms/application-form';
import { cn } from '@/lib/utils';

export function ApplyView({ type }: { type: ApplicationType }) {
  const meta = APPLICATION_TYPE_META[type];

  return (
    <Section eyebrow="[ Work With Us ]" title={meta.label}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="max-w-md text-muted">{meta.blurb}</p>
          <nav className="mt-8 flex flex-col gap-2" aria-label="Application types">
            {APPLICATION_TYPES.map((t) => {
              const href = t === 'dj' ? '/dj' : `/apply/${t}`;
              return (
                <Link
                  key={t}
                  href={href}
                  className={cn(
                    'border px-4 py-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors',
                    t === type
                      ? 'border-electric/60 bg-ink-700 text-white'
                      : 'border-line text-muted hover:border-white/30 hover:text-white',
                  )}
                >
                  {APPLICATION_TYPE_META[t].label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border border-line bg-ink-800 p-6 md:p-8">
          <ApplicationForm type={type} />
        </div>
      </div>
    </Section>
  );
}
