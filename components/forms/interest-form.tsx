'use client';

import { useState } from 'react';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

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
      <Field label="Name (optional)" htmlFor={`int-name-${concept}`} error={errors.name}>
        <Input id={`int-name-${concept}`} name="name" autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor={`int-email-${concept}`} error={errors.email}>
        <Input id={`int-email-${concept}`} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Phone (optional)" htmlFor={`int-phone-${concept}`} error={errors.phone}>
        <Input id={`int-phone-${concept}`} name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Button type="submit" disabled={status === 'loading'} className="w-full">
        {status === 'loading' ? 'Sending…' : "I'm Interested"}
      </Button>
      {message && (
        <p className={status === 'error' ? 'field-error' : 'text-xs text-electric-400'}>{message}</p>
      )}
    </form>
  );
}
