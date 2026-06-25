import { cn } from '@/lib/utils';

/**
 * Scrolling marquee header for the /events page. The caller resolves the text
 * ("NOW SHOWING: …" / "NEXT UP: …" / "NO UPCOMING EVENTS POSTED YET") from real
 * Supabase data — this component only animates it.
 *
 * The track is a row of identical segments translated -50% on loop, so the
 * reset is visually seamless. Motion is gated behind `motion-safe:`; under
 * `prefers-reduced-motion` the animation is off, the duplicate segments are
 * hidden, and a single static, centered label is shown instead. `role="status"`
 * + `aria-label` announce the text once; the visible segments are decorative.
 */
const SEGMENTS = 8;

export function EventMarquee({ text }: { text: string }) {
  return (
    <div
      role="status"
      aria-label={text}
      className="relative z-[2] overflow-hidden border-y border-border bg-accent py-3 text-white"
    >
      <div className="flex w-max items-center will-change-transform motion-safe:animate-marquee motion-reduce:w-full motion-reduce:justify-center">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'flex items-center gap-6 px-6 font-display text-[clamp(1.2rem,3.4vw,2rem)] uppercase tracking-wide whitespace-nowrap',
              // Keep only the first segment in the reduced-motion static view.
              i > 0 && 'motion-reduce:hidden',
            )}
          >
            {text}
            <span className="text-white/50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
