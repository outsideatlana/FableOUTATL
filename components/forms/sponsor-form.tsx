'use client';

import { useState } from 'react';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/**
 * Sponsor / partner inquiry form. Posts (same-origin) to the dedicated sponsor
 * route, which forwards ONLY to the Airtable Sponsors table — never the Vendors
 * table and never Airtable directly from the browser.
 *
 * Select option values must match the Airtable singleSelect choices exactly.
 */
const SPONSORSHIP_TYPES = [
  'Cash Sponsorship',
  'In-Kind / Product',
  'Media / Promotional',
  'Brand Activation',
  'Other',
];

const BUDGET_RANGES = [
  'Under $1,000',
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
  'Flexible / Not sure',
];

export function SponsorForm() {
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
      instagram: fd.get('instagram'),
      company: fd.get('company'),
      website_url: fd.get('website_url'),
      sponsorship_type: fd.get('sponsorship_type'),
      budget_range: fd.get('budget_range'),
      what_to_sponsor: fd.get('what_to_sponsor'),
      message: fd.get('message'),
    };

    try {
      const res = await fetch('/api/applications/sponsors', {
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
      setMessage("Thanks for reaching out — we review every partnership pitch and we'll be in touch.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact Name" htmlFor="sp-name" error={errors.name}>
          <Input id="sp-name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="sp-email" error={errors.email}>
          <Input id="sp-email" name="email" type="email" autoComplete="email" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" htmlFor="sp-phone" error={errors.phone}>
          <Input id="sp-phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field label="Instagram (optional)" htmlFor="sp-ig" error={errors.instagram}>
          <Input id="sp-ig" name="instagram" placeholder="@yourbrand" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company / Brand Name (optional)" htmlFor="sp-company" error={errors.company}>
          <Input id="sp-company" name="company" autoComplete="organization" />
        </Field>
        <Field
          label="Website URL (optional)"
          htmlFor="sp-website"
          error={errors.website_url}
          hint="Include https://"
        >
          <Input id="sp-website" name="website_url" type="url" placeholder="https://" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sponsorship Type (optional)" htmlFor="sp-type" error={errors.sponsorship_type}>
          <Select id="sp-type" name="sponsorship_type" defaultValue="">
            <option value="">Select a type…</option>
            {SPONSORSHIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Budget Range (optional)" htmlFor="sp-budget" error={errors.budget_range}>
          <Select id="sp-budget" name="budget_range" defaultValue="">
            <option value="">Select a range…</option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="What do you want to sponsor? (optional)"
        htmlFor="sp-what"
        error={errors.what_to_sponsor}
        hint="Events, activations, merch, media — tell us what you're after."
      >
        <Textarea id="sp-what" name="what_to_sponsor" rows={3} />
      </Field>
      <Field label="Message (optional)" htmlFor="sp-message" error={errors.message}>
        <Textarea id="sp-message" name="message" rows={5} />
      </Field>
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting…' : 'Submit Sponsorship Inquiry'}
      </Button>
      {message && (
        <p className={status === 'error' ? 'field-error' : 'text-sm text-electric-400'}>{message}</p>
      )}
    </form>
  );
}
