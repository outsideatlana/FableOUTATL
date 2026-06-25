import Image from 'next/image';
import Link from 'next/link';
import { OUTSIDEATL_LOGO_URL } from '@/lib/media';

/**
 * Top navigation — ported from the Lovable design: sticky, blurred,
 * mono uppercase links, blue RSVP button. Brand lockup is the OutsideAtl logo
 * (non-transparent, visible on the dark background) followed by the OUTSIDEATL
 * wordmark ("Atl" keeps the red brand highlight). Logo is height-constrained
 * with object-contain so its square aspect ratio is never distorted; it shrinks
 * on mobile so the existing nav/RSVP layout is untouched.
 */
export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
      <Link href="/" aria-label="OutsideAtl home" className="flex items-center gap-2 sm:gap-3">
        <Image
          src={OUTSIDEATL_LOGO_URL}
          alt=""
          aria-hidden="true"
          width={548}
          height={548}
          priority
          className="h-10 w-auto object-contain sm:h-12"
        />
        <span className="font-display text-2xl uppercase tracking-tight">
          Outside<span className="text-red-600">Atl</span>
        </span>
      </Link>

      <div className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-widest md:flex">
        <Link href="/events" className="transition-colors hover:text-accent">Events</Link>
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
