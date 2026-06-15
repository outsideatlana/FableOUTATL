'use client';

import { useState } from 'react';

interface EventOption {
  id: string;
  title: string;
}

/**
 * Pre-RSVP form — PRESERVED behavior. Posts to /api/rsvp (Supabase +
 * optional Airtable). Fields match the backend schema; styling matches the
 * Lovable design.
 */
export function RsvpForm({
  events,
  defaultEventId,
}: {
  events: EventOption[];
  defaultEventId?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrors({});
    setMessage('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      event_id: fd.get('event_id') || null,
      instagram: fd.get('instagram'),
      notes: fd.get('notes'),
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.fields ?? {});
        setStatus('error');
        setMessage(body.error ?? 'Something went wrong.');
        return;
      }
      form.reset();
      setStatus('success');
      setMessage("You're on the list. We'll be in touch.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-label="Pre-RSVP form" noValidate>
      <div>
        <input name="name" required autoComplete="name" placeholder="Full name *" aria-label="Full name" className="field-input" />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <input name="email" type="email" required autoComplete="email" placeholder="Email *" aria-label="Email" className="field-input" />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <input name="phone" type="tel" autoComplete="tel" placeholder="Phone" aria-label="Phone" className="field-input" />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
      </div>
      <input name="instagram" placeholder="@instagram" aria-label="Instagram handle" className="field-input" />
      <select name="event_id" defaultValue={defaultEventId ?? ''} aria-label="Event of interest" className="field-input cursor-pointer">
        <option value="">Interested in: any event</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.title}</option>
        ))}
      </select>
      <textarea name="notes" rows={3} placeholder="Anything else?" aria-label="Notes" className="field-input resize-y" />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-accent px-8 py-4 font-display text-xl uppercase tracking-tight text-accent-foreground transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Pre-RSVP'}
      </button>
      {message && (
        <p className={status === 'error' ? 'field-error' : 'text-sm text-red-600'}>{message}</p>
      )}
    </form>
  );
}
