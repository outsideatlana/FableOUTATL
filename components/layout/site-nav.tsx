import Link from 'next/link';

/**
 * Top navigation — ported from the Lovable design: sticky, blurred,
 * mono uppercase links, blue RSVP button. (Wordmark instead of the
 * Lovable logo asset; "Atl" picks up the red brand highlight.)
 */
export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
      <Link href="/" aria-label="OutsideAtl home" className="font-display text-2xl uppercase tracking-tight">
        Outside<span className="text-red-600">Atl</span>
      </Link>

      <div className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-widest md:flex">
        <Link href="/#events" className="transition-colors hover:text-accent">Events</Link>
        <Link href="/#apply" className="transition-colors hover:text-accent">Work With Us</Link>
        <Link href="/dj" className="transition-colors hover:text-accent">DJ Submit</Link>
        <Link href="/#contact" className="transition-colors hover:text-accent">Contact</Link>
        <Link href="/#rsvp" className="bg-accent px-3 py-2 font-bold text-accent-foreground transition-transform hover:scale-105">
          RSVP
        </Link>
      </div>

      <Link href="/#rsvp" className="bg-accent px-3 py-2 font-mono text-[10px] font-bold uppercase text-accent-foreground md:hidden">
        RSVP
      </Link>
    </nav>
  );
}
