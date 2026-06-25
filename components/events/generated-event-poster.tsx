import { cn } from '@/lib/utils';

/**
 * Typographic fallback "flyer" for events with no uploaded poster. It styles
 * the REAL event title in OutsideAtl's ransom/nightlife language — no stock
 * art, no invented event info. When there's no title either, it falls back to
 * the neutral "OutsideAtl Event" wordmark.
 *
 * Deterministic per-word styling (keyed by word index, not Math.random) so the
 * server and client render identically — no hydration mismatch.
 */

// Repeating "ransom note" treatments, picked by word index.
const WORD_STYLES = [
  'text-foreground',
  'bg-red-600 px-2 text-white',
  'text-electric-400',
  'border border-foreground/40 px-2 text-foreground',
  'bg-foreground px-2 text-background',
];
const ROTATIONS = ['-1.5deg', '1.25deg', '-0.75deg', '2deg', '-2deg', '0.75deg'];

export function GeneratedEventPoster({
  title,
  subtitle,
  dateLabel,
  className,
}: {
  title?: string | null;
  subtitle?: string | null;
  dateLabel?: string | null;
  className?: string;
}) {
  const safeTitle = (title && title.trim()) || 'OutsideAtl Event';
  const words = safeTitle.split(/\s+/).filter(Boolean);

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-ink-800 p-8 text-center',
        className,
      )}
    >
      {/* Soft brand glow behind the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: 'var(--gradient-hero-radial)' }}
      />

      <p className="relative z-10 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-electric-400">
        [ OutsideAtl ]
      </p>

      <div className="relative z-10 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={cn(
              'inline-block font-display text-3xl uppercase leading-none tracking-tight sm:text-4xl md:text-5xl',
              WORD_STYLES[i % WORD_STYLES.length],
            )}
            style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}
          >
            {word}
          </span>
        ))}
      </div>

      {subtitle && subtitle.trim() && (
        <p className="relative z-10 max-w-xs text-sm text-white/70">{subtitle}</p>
      )}
      {dateLabel && (
        <p className="relative z-10 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
          {dateLabel}
        </p>
      )}
    </div>
  );
}
