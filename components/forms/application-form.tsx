'use client';

import { useState } from 'react';
import type { ApplicationType } from '@/types/database';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/**
 * Each application type submits to its own server route, which forwards to the
 * matching Airtable table (Interns / Freelance / Vendors / Dj). The browser
 * only calls these same-origin /api routes — never Airtable directly.
 */
const ENDPOINT: Record<ApplicationType, string> = {
  intern: '/api/applications/interns',
  freelancer: '/api/applications/freelance',
  vendor: '/api/applications/vendors',
  dj: '/api/applications/dj',
};

export function ApplicationForm({ type }: { type: ApplicationType }) {
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
      type,
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      instagram: fd.get('instagram'),
      portfolio_url: fd.get('portfolio_url'),
      experience: fd.get('experience'),
      message: fd.get('message'),
    };

    try {
      const res = await fetch(ENDPOINT[type] ?? '/api/applications', {
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
      setMessage("Application received. We read everything — we'll be in touch.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  const isDj = type === 'dj';

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="app-name" error={errors.name}>
          <Input id="app-name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="app-email" error={errors.email}>
          <Input id="app-email" name="email" type="email" autoComplete="email" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" htmlFor="app-phone" error={errors.phone}>
          <Input id="app-phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field label="Instagram (optional)" htmlFor="app-ig" error={errors.instagram}>
          <Input id="app-ig" name="instagram" placeholder="@yourhandle" />
        </Field>
      </div>
      <Field
        label={isDj ? 'Mix / Portfolio Link' : 'Portfolio / Links (optional)'}
        htmlFor="app-portfolio"
        error={errors.portfolio_url}
        hint="Include https://"
      >
        <Input id="app-portfolio" name="portfolio_url" type="url" placeholder="https://" />
      </Field>
      <Field label="Experience (optional)" htmlFor="app-exp" error={errors.experience}>
        <Textarea id="app-exp" name="experience" rows={3} />
      </Field>
      <Field
        label={isDj ? 'Tell us about your sound' : 'Message / Bio (optional)'}
        htmlFor="app-message"
        error={errors.message}
      >
        <Textarea id="app-message" name="message" rows={5} />
      </Field>
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting…' : 'Submit Application'}
      </Button>
      {message && (
        <p className={status === 'error' ? 'field-error' : 'text-sm text-electric-400'}>{message}</p>
      )}
    </form>
  );
}
