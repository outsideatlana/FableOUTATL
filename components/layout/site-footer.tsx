import Link from 'next/link';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="border-t border-line bg-ink-800">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <Link href="/" className="font-display text-3xl uppercase tracking-tight">
            Outside<span className="text-hot">Atl</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted">
            Atlanta-born creative collective producing parties, festivals, concerts,
            raves, and pop-ups across the city.
          </p>
          <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted">
            © {year} / Atlanta GA / All rights reserved
          </p>
        </div>

        <div>
          <h2 className="mono-label mb-4">Socials</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://instagram.com/outsid3.atl" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://tiktok.com/@outsid3.atl" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white">
                TikTok
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mono-label mb-4">Apply</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/apply/intern" className="text-muted hover:text-white">Internships</Link></li>
            <li><Link href="/apply/freelancer" className="text-muted hover:text-white">Freelance Crew</Link></li>
            <li><Link href="/apply/vendor" className="text-muted hover:text-white">Vendors</Link></li>
            <li><Link href="/dj" className="text-muted hover:text-white">DJs &amp; Artists</Link></li>
          </ul>
          <Link
            href="/admin"
            className="mt-6 inline-block font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted/60 hover:text-white"
          >
            [ Admin ]
          </Link>
        </div>
      </div>
    </footer>
  );
}
