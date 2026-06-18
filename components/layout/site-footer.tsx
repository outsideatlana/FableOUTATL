import Image from 'next/image';
import Link from 'next/link';
import { OUTSIDEATL_TRANSPARENT_LOGO_URL } from '@/lib/media';

/** Footer — ported from the Lovable design. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="border-t border-border">
      <div className="flex flex-col items-start justify-between gap-12 px-6 py-16 md:flex-row">
        <div className="space-y-4">
          <Link href="/" className="block font-display text-4xl uppercase tracking-tight">
            Outside<span className="text-red-600">Atl</span>
          </Link>
          <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
            <p>© {year} OUTSIDEATL</p>
            <p>ATLANTA, GA</p>
            <p>contact@outsideatl.co</p>
            <p>ALL RIGHTS RESERVED</p>
          </div>
          <Link
            href="/admin"
            className="mt-4 inline-block border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Admin
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-16">
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

      {/* Centered transparent OutsideAtl logo, sized exactly 200×150 with
          object-contain so the square mark fits without stretch/crop. */}
      <div className="flex justify-center border-t border-border px-6 py-10">
        <Image
          src={OUTSIDEATL_TRANSPARENT_LOGO_URL}
          alt="OutsideAtl"
          width={200}
          height={150}
          sizes="200px"
          className="object-contain"
        />
      </div>
    </footer>
  );
}
