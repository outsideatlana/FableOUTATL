'use client';

import { useState } from 'react';

/**
 * "What should we throw next?" idea form. Posts to the server route
 * /api/interest, which writes to the Airtable INTEREST FORMS table (never
 * Supabase). Collects contact info, the event idea, and consent, and shows
 * loading / success / error states.
 */
export function InterestForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'loading') return;
    setErrors({});
    setMessage('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
      instagram: String(fd.get('instagram') ?? '').trim(),
      idea_title: String(fd.get('idea_title') ?? '').trim(),
      idea_description: String(fd.get('idea_description') ?? '').trim(),
      preferred_vibe: String(fd.get('preferred_vibe') ?? '').trim(),
      consent: fd.get('consent') === 'on',
    };

    // Client-side validation of the required fields (server re-validates).
    const required: Record<string, string> = {};
    if (!payload.name) required.name = 'Name is required.';
    if (!payload.email) required.email = 'Email is required.';
    if (!payload.idea_title) required.idea_title = 'Tell us your event idea.';
    if (!payload.idea_description) required.idea_description = 'Describe the vibe — what should we throw?';
    if (Object.keys(required).length > 0) {
      setErrors(required);
      setStatus('error');
      setMessage('Please fill in the required fields.');
      return;
    }

    setStatus('loading');

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
      setMessage("Idea received. If the people want it, we'll make it happen.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-label="Event idea form" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Name *"
            aria-label="Name"
            className="field-input"
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email *"
            aria-label="Email"
            className="field-input"
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div>
          <input
            name="instagram"
            placeholder="@instagram (optional)"
            aria-label="Instagram handle"
            className="field-input"
          />
          {errors.instagram && <p className="field-error">{errors.instagram}</p>}
        </div>
      </div>

      <div>
        <input
          name="idea_title"
          required
          placeholder="Your event idea (title) *"
          aria-label="Event idea title"
          className="field-input"
        />
        {errors.idea_title && <p className="field-error">{errors.idea_title}</p>}
      </div>

      <div>
        <textarea
          name="idea_description"
          required
          rows={4}
          placeholder="Describe the vibe — venue, music, crowd, anything… *"
          aria-label="Idea description"
          className="field-input resize-y"
        />
        {errors.idea_description && <p className="field-error">{errors.idea_description}</p>}
      </div>

      <div>
        <input
          name="preferred_vibe"
          placeholder="Preferred vibe / day (optional)"
          aria-label="Preferred vibe or day"
          className="field-input"
        />
        {errors.preferred_vibe && <p className="field-error">{errors.preferred_vibe}</p>}
      </div>

      <label className="flex items-start gap-3 py-1 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="consent"
          className="mt-1 size-4 accent-[hsl(220_70%_28%)]"
          aria-label="Consent to be contacted"
        />
        <span>I agree to be contacted about this idea and future OutsideAtl events.</span>
      </label>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-accent px-8 py-4 font-display text-xl uppercase tracking-tight text-accent-foreground transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Submit Idea'}
      </button>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={status === 'error' ? 'field-error' : 'text-sm text-red-600'}
        >
          {message}
        </p>
      )}
    </form>
  );
}
