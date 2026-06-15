import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { isAirtableEnabled } from '@/lib/airtable/client';
import {
  getAdminApplications,
  getAdminEvents,
  getAdminRecaps,
  getAdminRsvps,
} from '@/lib/data/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const configured = isSupabaseConfigured();
  const [events, rsvps, applications, recaps] = await Promise.all([
    getAdminEvents(),
    getAdminRsvps(),
    getAdminApplications(),
    getAdminRecaps(),
  ]);
  const newApps = applications.filter((a) => a.status === 'new').length;

  const stats = [
    { label: 'Events', value: events.length, href: '/admin/events' },
    { label: 'RSVPs', value: rsvps.length, href: '/admin/rsvps' },
    { label: 'Applications', value: applications.length, href: '/admin/applications', note: `${newApps} new` },
    { label: 'Recap Photos', value: recaps.length, href: '/admin/recaps' },
  ];

  return (
    <div>
      <p className="mono-label">[ Dashboard ]</p>
      <h1 className="mt-1 font-display text-4xl uppercase tracking-tight">Overview</h1>

      {!configured && (
        <div className="mt-6 border border-hot/40 bg-hot/10 p-4 text-sm">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-hot-400">[ Setup needed ]</p>
          <p className="mt-2 text-white/90">
            Supabase is not configured. Set <code className="text-hot-400">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
            <code className="text-hot-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{' '}
            <code className="text-hot-400">SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>, then run
            the migration in <code>supabase/migrations</code>.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="border border-line bg-ink-800 p-5 transition-colors hover:border-white/30">
            <p className="font-display text-4xl">{s.value}</p>
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted">{s.label}</p>
            {s.note && <p className="mt-1 text-xs text-electric-400">{s.note}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted">
        <span className="border border-line px-3 py-2 font-mono uppercase tracking-[0.15em]">
          Airtable sync: <span className={isAirtableEnabled() ? 'text-electric-400' : 'text-muted'}>{isAirtableEnabled() ? 'On' : 'Off'}</span>
        </span>
        <Link href="/" className="border border-line px-3 py-2 font-mono uppercase tracking-[0.15em] hover:text-white">
          View public site →
        </Link>
      </div>
    </div>
  );
}
