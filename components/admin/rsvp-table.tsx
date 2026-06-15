'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminRsvp } from '@/lib/data/admin';
import { Input, Select } from '@/components/ui/field';
import { Button, buttonClasses } from '@/components/ui/button';

interface EventOption {
  id: string;
  title: string;
}

export function RsvpTable({
  rsvps,
  eventOptions,
}: {
  rsvps: AdminRsvp[];
  eventOptions: EventOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [eventId, setEventId] = useState('');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  /**
   * Remove an RSVP from the admin dashboard only. Inserts a row into
   * admin_hidden_records via the server route, then drops it from the UI.
   * The RSVP stays in Airtable — no Airtable delete is ever called.
   */
  async function removeFromDashboard(r: AdminRsvp) {
    if (busyId) return;
    if (!confirm(`Remove ${r.name}'s RSVP from the dashboard? It stays saved in Airtable and can be restored from Hidden.`)) {
      return;
    }
    setBusyId(r.id);
    try {
      const res = await fetch('/api/admin/hidden-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceTable: 'RSVPS', sourceRecordId: r.id, reason: 'Removed from dashboard' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? 'Could not remove the RSVP. Try again.');
        return;
      }
      setRemoved((prev) => new Set(prev).add(r.id));
      router.refresh();
    } catch {
      alert('Network error. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (removed.has(r.id)) return false;
      if (eventId && r.event_id !== eventId) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [rsvps, query, eventId, removed]);

  const exportHref = eventId
    ? `/api/admin/rsvps/export?event=${eventId}`
    : '/api/admin/rsvps/export';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Input
            placeholder="Search name, email, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-56">
          <option value="">All events</option>
          {eventOptions.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </Select>
        <a href={exportHref} className={buttonClasses('outline', 'sm')}>
          Export CSV
        </a>
      </div>

      <p className="mono-label mb-2">[ {filtered.length} of {rsvps.length} ]</p>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-ink-700">
            <tr className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Event</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">No RSVPs match.</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-muted">{r.email}</td>
                  <td className="p-3 text-muted">{r.phone ?? '—'}</td>
                  <td className="p-3 text-muted">{r.event_title ?? '—'}</td>
                  <td className="p-3 font-mono text-[0.65rem] text-muted">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="hot"
                      disabled={busyId === r.id}
                      onClick={() => removeFromDashboard(r)}
                      title="Removes this RSVP from the dashboard only — it stays in Airtable"
                    >
                      {busyId === r.id ? 'Removing…' : 'Remove from dashboard'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
