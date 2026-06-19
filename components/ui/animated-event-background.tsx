import { cn } from '@/lib/utils';

/**
 * Reusable animated glow/radial backdrop — the OutsideAtl "event detail" hero
 * treatment, shared by the landing hero and the event detail hero so the two
 * pages feel visually connected.
 *
 * Pure CSS: the `.hero-glow` (slow-spinning conic gradient) and `.hero-radial`
 * (pulsing radial) layers live in app/globals.css and are driven by
 * --gradient-hero / --gradient-hero-radial. No client JS, so it's safe in a
 * Server Component and produces no hydration mismatch. `prefers-reduced-motion`
 * disables the animation globally (see globals.css), keeping text readable.
 *
 * Decorative only — marked aria-hidden and pointer-events-none so it never
 * intercepts clicks or confuses assistive tech.
 */
export function AnimatedEventBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden',
        className,
      )}
    >
      <div className="hero-glow" />
      <div className="hero-radial" />
    </div>
  );
}
