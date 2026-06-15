'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/rsvps', label: 'RSVPs' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/recaps', label: 'Recaps' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-xl uppercase tracking-tight">
            Outside<span className="text-hot">Atl</span>
          </Link>
          <span className="border border-line px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted">
            Admin
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
          {LINKS.map((l) => {
            const active = l.href === '/admin' ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.15em] transition-colors',
                  active ? 'bg-electric text-white' : 'text-muted hover:text-white',
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={signOut}
            className="ml-2 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted hover:text-hot-400"
          >
            [ Sign out ]
          </button>
        </nav>
      </div>
    </header>
  );
}
