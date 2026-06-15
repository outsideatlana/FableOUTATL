'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/apply/intern', label: 'Work With Us' },
  { href: '/dj', label: 'DJ Submit' },
  { href: '/#contact', label: 'Contact' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-2xl uppercase tracking-tight">
          Outside<span className="text-hot">Atl</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/events"
            className="bg-hot px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-hot-700"
          >
            RSVP
          </Link>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="font-mono text-lg">{open ? '✕' : '≡'}</span>
        </button>
      </div>

      <div className={cn('border-t border-line md:hidden', open ? 'block' : 'hidden')}>
        <nav className="flex flex-col px-5 py-3" aria-label="Mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 font-mono text-sm uppercase tracking-[0.15em] text-muted hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/events"
            onClick={() => setOpen(false)}
            className="mt-2 bg-hot px-5 py-3 text-center font-mono text-sm font-semibold uppercase tracking-[0.15em] text-white"
          >
            RSVP
          </Link>
        </nav>
      </div>
    </header>
  );
}
