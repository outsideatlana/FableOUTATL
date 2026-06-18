import Image from 'next/image';
import Link from 'next/link';
import { OUTSIDEATL_LOGO_URL } from '@/lib/media';

/**
 * Footer — ported from the Lovable design. One clean row:
 * left = info + admin · middle = OutsideAtl logo · right = socials + apply.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="flex flex-col items-center gap-12 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4 text-center md:text-left">
          <Link href="/" className="block font-display text-4xl uppercase tracking-tight">
            Outside<span className="text-red-600">Atl</span>
          </Link>
          <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
            <p>© {year} OUTSIDEATL</p>
            <p>ATLANTA, GA</p>
            <p>contact@outsideatl.co</p>
            <p>ALL RIGHTS RESERVED</p>
          </div>
          

        {/* Middle: non-transparent OutsideAtl logo (visible on the dark
            background), object-contain so the square mark is never distorted. */}
        <div className="flex justify-center">
          <Image
            src={OUTSIDEATL_LOGO_URL}
            alt="OutsideAtl"
            width={548}
            height={548}
            sizes="128px"
            className="h-28 w-28 object-contain md:h-32 md:w-32"
          />
        </div>

        <div className="grid grid-cols-2 gap-16 text-center md:text-left">
          <div className="space-y-4">
            <h2 className="font-mono text-[10px] font-bold uppercase text-red-600">Socials</h2>
            <ul className="space-y-1 font-display text-lg uppercase">
              <li><a href="https://instagram.com/outsid3.atl" target="_blank" rel="noreferrer" className="hover:text-accent">Instagram</a></li>
              <li><a href="https://tiktok.com/@outsid3.atl" target="_blank" rel="noreferrer" className="hover:text-accent">TikTok</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="font-mono text-[10px] font-bold uppercase text-red-600">Apply</h2>
            <ul className="space-y-1 font-display text-lg uppercase">
              <li><Link href="/dj" className="hover:text-accent">DJs/Artists</Link></li>
              <li><Link href="/apply/vendor" className="hover:text-accent">Vendors</Link></li>
              <li><Link href="/apply/sponsors" className="hover:text-accent">Sponsors</Link></li>
              <li><Link href="/apply/freelancer" className="hover:text-accent">Freelancers</Link></li>
              <li><Link href="/apply/intern" className="hover:text-accent">Interns</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
