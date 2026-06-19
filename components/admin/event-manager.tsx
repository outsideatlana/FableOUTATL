'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { AdminEvent } from '@/lib/data/admin';
import type { EventRow, EventStatus } from '@/types/database';
import { EVENT_STATUS_META } from '@/types/events';
import { missingForPublish } from '@/lib/validation/schemas';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEventDate } from '@/lib/utils';

const STATUSES: EventStatus[] = ['draft', 'published', 'sold_out', 'archived'];

type FormState = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  status: EventStatus;
  is_featured: boolean;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  venue_name: string;
  venue_address: string;
  city_state: string;
  description: string;
  lineup: string; // one artist per line in the form
  age_restriction: string;
  price_label: string;
  use_internal_rsvp: boolean;
  rsvp_url: string;
  ticket_url: string;
  seo_title: string;
  seo_description: string;
  cta_text: string;
  cta_url: string;
  hero_image_url: string;
  hero_image_pathname: string;
};

const EMPTY: FormState = {
  id: '',
  title: '',
  subtitle: '',
  slug: '',
  category: '',
  status: 'draft',
  is_featured: false,
  event_date: '',
  start_time: '',
  end_time: '',
  location: '',
  venue_name: '',
  venue_address: '',
  city_state: '',
  description: '',
  lineup: '',
  age_restriction: '',
  price_label: '',
  use_internal_rsvp: true,
  rsvp_url: '',
  ticket_url: '',
  seo_title: '',
  seo_description: '',
  cta_text: '',
  cta_url: '',
  hero_image_url: '',
  hero_image_pathname: '',
};

/** ISO timestamp -> value for <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** API payload shape — shared by create/update and quick status changes. */
type EventPayload = ReturnType<typeof payloadFromForm>;

function payloadFromForm(form: FormState, hero: { url: string; pathname: string }) {
  return {
    title: form.title,
    subtitle: form.subtitle,
    slug: form.slug || undefined,
    category: form.category,
    status: form.status,
    is_featured: form.is_featured,
    event_date: form.event_date || null,
    start_time: form.start_time,
    end_time: form.end_time,
    location: form.location,
    venue_name: form.venue_name,
    venue_address: form.venue_address,
    city_state: form.city_state,
    description: form.description,
    lineup: form.lineup.split('\n').map((s) => s.trim()).filter(Boolean),
    age_restriction: form.age_restriction,
    price_label: form.price_label,
    use_internal_rsvp: form.use_internal_rsvp,
    rsvp_url: form.rsvp_url,
    ticket_url: form.ticket_url,
    seo_title: form.seo_title,
    seo_description: form.seo_description,
    cta_text: form.cta_text,
    cta_url: form.cta_url,
    hero_image_url: hero.url,
    hero_image_pathname: hero.pathname,
  };
}

/**
 * Build a FULL payload from an existing row. PATCH replaces every column, so
 * quick actions (publish / unpublish) must resend all fields — otherwise the
 * unsent ones would be wiped back to their defaults.
 */
function payloadFromEvent(ev: EventRow): EventPayload {
  return {
    title: ev.title,
    subtitle: ev.subtitle ?? '',
    slug: ev.slug || undefined,
    category: ev.category ?? '',
    status: ev.status,
    is_featured: ev.is_featured,
    event_date: ev.event_date,
    start_time: ev.start_time ?? '',
    end_time: ev.end_time ?? '',
    location: ev.location ?? '',
    venue_name: ev.venue_name ?? '',
    venue_address: ev.venue_address ?? '',
    city_state: ev.city_state ?? '',
    description: ev.description ?? '',
    lineup: Array.isArray(ev.lineup) ? ev.lineup : [],
    age_restriction: ev.age_restriction ?? '',
    price_label: ev.price_label ?? '',
    use_internal_rsvp: ev.use_internal_rsvp,
    rsvp_url: ev.rsvp_url ?? '',
    ticket_url: ev.ticket_url ?? '',
    seo_title: ev.seo_title ?? '',
    seo_description: ev.seo_description ?? '',
    cta_text: ev.cta_text ?? '',
    cta_url: ev.cta_url ?? '',
    hero_image_url: ev.hero_image_url ?? '',
    hero_image_pathname: ev.hero_image_pathname ?? '',
  };
}

export function EventManager({ initialEvents }: { initialEvents: AdminEvent[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  const editing = Boolean(form.id);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Non-blocking "what's missing" hint when the admin is about to go live.
  const willBePublic = form.status === 'published' || form.status === 'sold_out';
  const missing = willBePublic
    ? missingForPublish({
        event_date: form.event_date,
        description: form.description,
        venue_name: form.venue_name || form.location,
        hero_image_url: form.hero_image_url || (file ? 'pending' : ''),
      })
    : [];

  function resetForm() {
    setForm({ ...EMPTY });
    setFile(null);
    setPreview('');
    setErrors({});
    setStatus('');
  }

  function startEdit(ev: AdminEvent) {
    setForm({
      id: ev.id,
      title: ev.title,
      subtitle: ev.subtitle ?? '',
      slug: ev.slug,
      category: ev.category ?? '',
      status: ev.status,
      is_featured: ev.is_featured,
      event_date: toLocalInput(ev.event_date),
      start_time: ev.start_time ?? '',
      end_time: ev.end_time ?? '',
      location: ev.location ?? '',
      venue_name: ev.venue_name ?? '',
      venue_address: ev.venue_address ?? '',
      city_state: ev.city_state ?? '',
      description: ev.description ?? '',
      lineup: Array.isArray(ev.lineup) ? ev.lineup.join('\n') : '',
      age_restriction: ev.age_restriction ?? '',
      price_label: ev.price_label ?? '',
      use_internal_rsvp: ev.use_internal_rsvp,
      rsvp_url: ev.rsvp_url ?? '',
      ticket_url: ev.ticket_url ?? '',
      seo_title: ev.seo_title ?? '',
      seo_description: ev.seo_description ?? '',
      cta_text: ev.cta_text ?? '',
      cta_url: ev.cta_url ?? '',
      hero_image_url: ev.hero_image_url ?? '',
      hero_image_pathname: ev.hero_image_pathname ?? '',
    });
    setFile(null);
    setPreview(ev.hero_image_url ?? '');
    setErrors({});
    setStatus('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : form.hero_image_url);
  }

  function removeImage() {
    setFile(null);
    setPreview('');
    setForm((f) => ({ ...f, hero_image_url: '', hero_image_pathname: '' }));
  }

  async function uploadHero(): Promise<{ url: string; pathname: string }> {
    if (!file) return { url: form.hero_image_url, pathname: form.hero_image_pathname };
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'events');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? 'Image upload failed.');
    return { url: body.url as string, pathname: (body.path as string) ?? '' };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setStatus('');
    try {
      const hero = await uploadHero();
      const payload = payloadFromForm(form, hero);
      const res = await fetch(editing ? `/api/events/${form.id}` : '/api/events', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.fields ?? {});
        setStatus(body.error ?? 'Could not save.');
        return;
      }
      resetForm();
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  async function quickStatus(ev: AdminEvent, next: EventStatus) {
    await fetch(`/api/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payloadFromEvent(ev), status: next }),
    });
    router.refresh();
  }

  async function remove(ev: AdminEvent) {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    await fetch(`/api/events/${ev.id}`, { method: 'DELETE' });
    if (form.id === ev.id) resetForm();
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      {/* Form */}
      <section className="border border-line bg-ink-800 p-6 lg:sticky lg:top-20">
        <p className="mono-label">[ {editing ? 'Edit Event' : 'New Event'} ]</p>
        <h2 className="mb-4 mt-1 font-display text-2xl uppercase">
          {editing ? 'Update Event' : 'Create Event'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* --- Basics --- */}
          <Field label="Title" htmlFor="ev-title" error={errors.title}>
            <Input id="ev-title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </Field>
          <Field label="Subtitle / Tagline" htmlFor="ev-subtitle" error={errors.subtitle}>
            <Input id="ev-subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="One warehouse. All night." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category / Type" htmlFor="ev-cat" error={errors.category}>
              <Input id="ev-cat" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Rave · Day Party" />
            </Field>
            <Field label="Status" htmlFor="ev-status" error={errors.status}>
              <Select id="ev-status" value={form.status} onChange={(e) => set('status', e.target.value as EventStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS_META[s].label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Checkbox id="ev-featured" label="Featured event (shown in the landing hero)" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />

          {/* --- When & where --- */}
          <p className="mono-label border-t border-line pt-4">[ When & Where ]</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="ev-date" error={errors.event_date}>
              <Input id="ev-date" type="datetime-local" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} />
            </Field>
            <Field label="Display time" htmlFor="ev-start" hint="e.g. 9:00 PM" error={errors.start_time}>
              <div className="grid grid-cols-2 gap-2">
                <Input id="ev-start" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} placeholder="Start" />
                <Input id="ev-end" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} placeholder="End" />
              </div>
            </Field>
          </div>
          <Field label="Venue name" htmlFor="ev-venue" error={errors.venue_name}>
            <Input id="ev-venue" value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venue address" htmlFor="ev-addr" error={errors.venue_address}>
              <Input id="ev-addr" value={form.venue_address} onChange={(e) => set('venue_address', e.target.value)} />
            </Field>
            <Field label="City / State" htmlFor="ev-city" error={errors.city_state}>
              <Input id="ev-city" value={form.city_state} onChange={(e) => set('city_state', e.target.value)} placeholder="Atlanta, GA" />
            </Field>
          </div>
          <Field label="Short location (event card label)" htmlFor="ev-loc" hint="Optional — shown on event cards" error={errors.location}>
            <Input id="ev-loc" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </Field>

          {/* --- Details --- */}
          <p className="mono-label border-t border-line pt-4">[ Details ]</p>
          <Field label="Description" htmlFor="ev-desc" error={errors.description}>
            <Textarea id="ev-desc" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Lineup / Artists" htmlFor="ev-lineup" hint="One per line" error={errors.lineup}>
            <Textarea id="ev-lineup" rows={3} value={form.lineup} onChange={(e) => set('lineup', e.target.value)} placeholder={'DJ One\nDJ Two'} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age restriction" htmlFor="ev-age" error={errors.age_restriction}>
              <Input id="ev-age" value={form.age_restriction} onChange={(e) => set('age_restriction', e.target.value)} placeholder="21+" />
            </Field>
            <Field label="Price label" htmlFor="ev-price" error={errors.price_label}>
              <Input id="ev-price" value={form.price_label} onChange={(e) => set('price_label', e.target.value)} placeholder="$20 / Free" />
            </Field>
          </div>

          {/* --- RSVP & tickets --- */}
          <p className="mono-label border-t border-line pt-4">[ RSVP & Tickets ]</p>
          <Checkbox id="ev-internal" label="Use built-in RSVP form" checked={form.use_internal_rsvp} onChange={(v) => set('use_internal_rsvp', v)} />
          {!form.use_internal_rsvp && (
            <Field label="External RSVP link" htmlFor="ev-rsvp" error={errors.rsvp_url}>
              <Input id="ev-rsvp" value={form.rsvp_url} onChange={(e) => set('rsvp_url', e.target.value)} placeholder="https://" />
            </Field>
          )}
          <Field label="Ticket link" htmlFor="ev-ticket" error={errors.ticket_url}>
            <Input id="ev-ticket" value={form.ticket_url} onChange={(e) => set('ticket_url', e.target.value)} placeholder="https://" />
          </Field>

          {/* --- Link & SEO --- */}
          <p className="mono-label border-t border-line pt-4">[ Link & SEO ]</p>
          <Field label="Slug (permalink)" htmlFor="ev-slug" hint="Auto-generated from title if blank" error={errors.slug}>
            <Input id="ev-slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="silent-disco" />
          </Field>
          <Field label="SEO title" htmlFor="ev-seotitle" hint="Defaults to the event title" error={errors.seo_title}>
            <Input id="ev-seotitle" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} />
          </Field>
          <Field label="SEO description" htmlFor="ev-seodesc" error={errors.seo_description}>
            <Textarea id="ev-seodesc" rows={2} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA text (optional)" htmlFor="ev-ctatext" error={errors.cta_text}>
              <Input id="ev-ctatext" value={form.cta_text} onChange={(e) => set('cta_text', e.target.value)} placeholder="View venue map" />
            </Field>
            <Field label="CTA link (optional)" htmlFor="ev-ctaurl" error={errors.cta_url}>
              <Input id="ev-ctaurl" value={form.cta_url} onChange={(e) => set('cta_url', e.target.value)} placeholder="https://" />
            </Field>
          </div>

          {/* --- Hero image --- */}
          <p className="mono-label border-t border-line pt-4">[ Poster / Hero Image ]</p>
          <Field label="Upload poster" htmlFor="ev-img" hint="JPG, PNG, or WEBP · max 5MB" error={errors.hero_image_url}>
            <input id="ev-img" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="field-input cursor-pointer file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1 file:font-mono file:text-[0.6rem] file:uppercase file:text-white" />
          </Field>
          {preview ? (
            <div className="space-y-2">
              <div className="relative aspect-video overflow-hidden border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Hero preview" className="h-full w-full object-contain" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-electric-400">
                  {file ? 'New upload (unsaved)' : 'Uploaded poster'}
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={removeImage}>
                  Remove image
                </Button>
              </div>
            </div>
          ) : (
            <p className="border border-dashed border-line p-4 text-center font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">
              No poster — a generated title flyer will be used.
            </p>
          )}

          {/* --- Publish hint + actions --- */}
          {missing.length > 0 && (
            <p className="border border-hot/40 bg-hot/5 p-3 text-xs text-hot-400">
              Heads up — this event will be public but is missing: {missing.join(', ')}. Neutral
              placeholders will show until you add them.
            </p>
          )}
          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Update Event' : 'Create Event'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
          {status && <p className="field-error">{status}</p>}
        </form>
      </section>

      {/* List */}
      <section>
        <p className="mono-label mb-3">[ {initialEvents.length} Event{initialEvents.length === 1 ? '' : 's'} ]</p>
        <div className="space-y-3">
          {initialEvents.length === 0 && (
            <p className="border border-line bg-ink-800 p-6 text-sm text-muted">No events yet.</p>
          )}
          {initialEvents.map((ev) => {
            const meta = EVENT_STATUS_META[ev.status];
            return (
              <div key={ev.id} className="flex flex-wrap items-start gap-4 border border-line bg-ink-800 p-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-line bg-ink-700">
                  {ev.hero_image_url ? (
                    <Image src={ev.hero_image_url} alt="" fill sizes="64px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={meta.className}>{meta.label}</Badge>
                    {ev.is_featured && <Badge className="text-electric-400 border-electric/40">Featured</Badge>}
                    <Badge className="border-line text-muted">
                      {ev.hero_image_url ? 'Poster' : 'Generated'}
                    </Badge>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-electric-400">
                      {ev.rsvp_count} RSVP{ev.rsvp_count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate font-display text-lg uppercase">{ev.title}</h3>
                  <p className="text-xs text-muted">{formatEventDate(ev.event_date)}{ev.venue_name || ev.location ? ` · ${ev.venue_name || ev.location}` : ''}</p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(ev)}>Edit</Button>
                  {ev.status === 'published' ? (
                    <Button size="sm" variant="ghost" onClick={() => quickStatus(ev, 'draft')}>Unpublish</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => quickStatus(ev, 'published')}>Publish</Button>
                  )}
                  {ev.status !== 'archived' && (
                    <Button size="sm" variant="ghost" onClick={() => quickStatus(ev, 'archived')}>Archive</Button>
                  )}
                  <Button size="sm" variant="hot" onClick={() => remove(ev)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** Small uppercase checkbox row matching the admin field styling. */
function Checkbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-electric"
      />
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </label>
  );
}
