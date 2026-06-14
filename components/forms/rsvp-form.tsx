'use client';

import { useState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

interface EventOption {
  id: string;
  title: string;
}

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
      setMessage("You're locked in. See you outside.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Full Name" htmlFor="rsvp-name" error={errors.name}>
        <Input id="rsvp-name" name="name" autoComplete="name" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="rsvp-email" error={errors.email}>
          <Input id="rsvp-email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Phone" htmlFor="rsvp-phone" error={errors.phone}>
          <Input id="rsvp-phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
      </div>
      <Field label="Event" htmlFor="rsvp-event" error={errors.event_id}>
        <Select id="rsvp-event" name="event_id" defaultValue={defaultEventId ?? ''}>
          <option value="">Any upcoming event</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Instagram (optional)" htmlFor="rsvp-ig" error={errors.instagram}>
        <Input id="rsvp-ig" name="instagram" placeholder="@yourhandle" />
      </Field>
      <Field label="Notes (optional)" htmlFor="rsvp-notes" error={errors.notes}>
        <Textarea id="rsvp-notes" name="notes" rows={3} />
      </Field>
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'RSVP'}
      </Button>
      {message && (
        <p className={status === 'error' ? 'field-error' : 'text-sm text-electric-400'}>{message}</p>
      )}
    </form>
  );
}
