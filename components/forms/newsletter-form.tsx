'use client';

import { useState } from 'react';

/**
 * Newsletter signup — posts to /api/signups (Supabase `signups` +
 * Airtable SIGNUPS). Distinct from the "what should we throw next?" idea
 * form, which goes to INTEREST FORMS.
 */
export function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setMessage('');
    const form = e.currentTarget;
    const email = new FormData(form).get('email');
    try {
      const res = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(body.error ?? 'Something went wrong.');
        return;
      }
      form.reset();
      setStatus('success');
      setMessage('Subscribed.');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:flex-row" aria-label="Newsletter signup" noValidate>
      <input
        name="email"
        type="email"
        required
        aria-label="Email address"
        placeholder="EMAIL@ADDRESS.COM"
        className="flex-1 border border-border bg-secondary px-6 py-4 font-mono text-sm uppercase text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-accent px-8 py-4 font-display text-xl uppercase tracking-tight text-accent-foreground transition-transform hover:scale-105 disabled:opacity-50"
      >
        {status === 'loading' ? '…' : 'Subscribe'}
      </button>
      {message && (
        <p className={`sm:hidden ${status === 'error' ? 'field-error' : 'text-sm text-red-600'}`}>{message}</p>
      )}
    </form>
  );
}
