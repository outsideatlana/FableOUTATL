'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { AdminEvent } from '@/lib/data/admin';
import type { EventStatus } from '@/types/database';
import { EVENT_STATUS_META } from '@/types/events';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEventDate } from '@/lib/utils';
import { uploadImageToBlob } from '@/lib/blob/client';

const STATUSES: EventStatus[] = ['draft', 'published', 'sold_out', 'archived'];

const EMPTY = {
  id: '',
  title: '',
  slug: '',
  event_date: '',
  location: '',
  description: '',
  status: 'draft' as EventStatus,
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

export function EventManager({ initialEvents }: { initialEvents: AdminEvent[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  const editing = Boolean(form.id);

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
      slug: ev.slug,
      event_date: toLocalInput(ev.event_date),
      location: ev.location ?? '',
      description: ev.description ?? '',
      status: ev.status,
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

  // Upload via the Vercel Blob server-upload route; returns url + pathname.
  async function uploadHero(): Promise<{ url: string; pathname: string }> {
    if (!file) return { url: form.hero_image_url, pathname: form.hero_image_pathname };
    const blob = await uploadImageToBlob({ file, folder: 'events' });
    return { url: blob.url, pathname: blob.pathname };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setStatus('');
    try {
      const { url: hero_image_url, pathname: hero_image_pathname } = await uploadHero();
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        event_date: form.event_date || null,
        location: form.location,
        description: form.description,
        status: form.status,
        hero_image_url,
        hero_image_pathname,
      };
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
      body: JSON.stringify({
        title: ev.title,
        slug: ev.slug,
        event_date: ev.event_date,
        location: ev.location,
        description: ev.description,
        status: next,
        hero_image_url: ev.hero_image_url,
        hero_image_pathname: ev.hero_image_pathname,
        flyer_image_url: ev.flyer_image_url,
        flyer_image_pathname: ev.flyer_image_pathname,
      }),
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
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Title" htmlFor="ev-title" error={errors.title}>
            <Input id="ev-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date & Time" htmlFor="ev-date" error={errors.event_date}>
              <Input id="ev-date" type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor="ev-status" error={errors.status}>
              <Select id="ev-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS_META[s].label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Location" htmlFor="ev-loc" error={errors.location}>
            <Input id="ev-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Slug (optional)" htmlFor="ev-slug" hint="Auto-generated from title if blank" error={errors.slug}>
            <Input id="ev-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="silent-disco" />
          </Field>
          <Field label="Description" htmlFor="ev-desc" error={errors.description}>
            <Textarea id="ev-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Hero Image" htmlFor="ev-img" hint="JPG, PNG, WEBP, or GIF · max 4.5MB" error={errors.hero_image_url}>
            <input id="ev-img" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} className="field-input cursor-pointer file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1 file:font-mono file:text-[0.6rem] file:uppercase file:text-white" />
          </Field>
          {preview && (
            <div className="relative aspect-video overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Hero preview" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
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
                  <div className="flex items-center gap-2">
                    <Badge className={meta.className}>{meta.label}</Badge>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-electric-400">
                      {ev.rsvp_count} RSVP{ev.rsvp_count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate font-display text-lg uppercase">{ev.title}</h3>
                  <p className="text-xs text-muted">{formatEventDate(ev.event_date)}{ev.location ? ` · ${ev.location}` : ''}</p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(ev)}>Edit</Button>
                  {ev.status === 'published' ? (
                    <Button size="sm" variant="ghost" onClick={() => quickStatus(ev, 'draft')}>Unpublish</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => quickStatus(ev, 'published')}>Publish</Button>
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
