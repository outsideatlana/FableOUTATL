'use client';

import { useState } from 'react';

/**
 * "Gauge My Interest" signup — PRESERVED behavior. Posts to /api/interest
 * with the concept name (Supabase + optional Airtable on the backend) and
 * shows success/error states. Restyled to the Lovable look only.
 */
export function InterestForm({ concept }: { concept: string }) {
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
      concept_name: concept,
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
    };

    try {
      const res = await fetch('/api/interest', {
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
      setMessage("You're on the list. We'll reach out when it's real.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>
      <div>
        <input
          name="name"
          autoComplete="name"
          placeholder="Name"
          aria-label="Name"
          className="field-input"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Email *"
          aria-label="Email"
          className="field-input"
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>
      <div>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Phone"
          aria-label="Phone"
          className="field-input"
        />
        {errors.phone && <p className="field-error">{errors.phone}</p>}
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-accent px-6 py-3 font-display text-lg uppercase tracking-tight text-accent-foreground transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : "I'm Interested"}
      </button>
      {message && (
        <p className={status === 'error' ? 'field-error' : 'text-xs text-red-600'}>{message}</p>
      )}
    </form>
  );
}
