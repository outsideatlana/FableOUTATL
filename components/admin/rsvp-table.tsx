'use client';

import { useMemo, useState } from 'react';
import type { AdminRsvp } from '@/lib/data/admin';
import { Input, Select } from '@/components/ui/field';
import { buttonClasses } from '@/components/ui/button';

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
  const [query, setQuery] = useState('');
  const [eventId, setEventId] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (eventId && r.event_id !== eventId) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [rsvps, query, eventId]);

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
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">No RSVPs match.</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
