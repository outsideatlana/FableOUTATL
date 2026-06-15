'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { HostedRow } from '@/types/database';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EMPTY = {
  id: '',
  name: '',
  description: '',
  link_url: '',
  sort_order: 0,
  published: true,
  image_url: '',
  image_pathname: '',
};

export function HostedManager({ initialHosted }: { initialHosted: HostedRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  const editing = Boolean(form.id);

  function resetForm() {
    setForm({ ...EMPTY, sort_order: initialHosted.length });
    setFile(null);
    setPreview('');
    setErrors({});
    setStatus('');
  }

  function startEdit(h: HostedRow) {
    setForm({
      id: h.id,
      name: h.name,
      description: h.description ?? '',
      link_url: h.link_url ?? '',
      sort_order: h.sort_order,
      published: h.published,
      image_url: h.image_url ?? '',
      image_pathname: h.image_pathname ?? '',
    });
    setFile(null);
    setPreview(h.image_url ?? '');
    setErrors({});
    setStatus('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : form.image_url);
  }

  // Upload the logo to Supabase Storage via the admin /api/upload route.
  async function uploadLogo(): Promise<{ url: string; path: string }> {
    if (!file) return { url: form.image_url, path: form.image_pathname };
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'hosted');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? 'Image upload failed.');
    return { url: body.url as string, path: (body.path as string) ?? '' };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setStatus('');
    try {
      const { url: image_url, path: image_pathname } = await uploadLogo();
      const payload = {
        name: form.name,
        description: form.description,
        link_url: form.link_url,
        sort_order: form.sort_order,
        published: form.published,
        image_url,
        image_pathname,
      };
      const res = await fetch(editing ? `/api/hosted/${form.id}` : '/api/hosted', {
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

  async function togglePublished(h: HostedRow) {
    await fetch(`/api/hosted/${h.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: h.name,
        description: h.description,
        link_url: h.link_url,
        sort_order: h.sort_order,
        published: !h.published,
        image_url: h.image_url,
        image_pathname: h.image_pathname,
      }),
    });
    router.refresh();
  }

  async function remove(h: HostedRow) {
    if (!confirm(`Delete "${h.name}"? This cannot be undone.`)) return;
    await fetch(`/api/hosted/${h.id}`, { method: 'DELETE' });
    if (form.id === h.id) resetForm();
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= initialHosted.length) return;
    const reordered = [...initialHosted];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const order = reordered.map((h, i) => ({ id: h.id, sort_order: i }));
    await fetch('/api/hosted/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      {/* Form */}
      <section className="border border-line bg-ink-800 p-6 lg:sticky lg:top-20">
        <p className="mono-label">[ {editing ? 'Edit Entry' : 'New Entry'} ]</p>
        <h2 className="mb-4 mt-1 font-display text-2xl uppercase">
          {editing ? 'Update Hosted' : 'Add Hosted'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="h-name" error={errors.name}>
            <Input id="h-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Logo / Image" htmlFor="h-img" hint="JPG, PNG, WEBP, or GIF · max 5MB" error={errors.image_url}>
            <input
              id="h-img"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onFile}
              className="field-input cursor-pointer file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1 file:font-mono file:text-[0.6rem] file:uppercase file:text-white"
            />
          </Field>
          {preview && (
            <div className="relative aspect-video overflow-hidden border border-line bg-ink-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Logo preview" className="h-full w-full object-contain" />
            </div>
          )}
          <Field label="Description (optional)" htmlFor="h-desc" error={errors.description}>
            <Textarea id="h-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
          </Field>
          <Field label="Link / Social URL (optional)" htmlFor="h-link" hint="Include https://" error={errors.link_url}>
            <Input id="h-link" type="url" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Sort order" htmlFor="h-sort" error={errors.sort_order}>
            <Input id="h-sort" type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </Field>
          <label className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="size-4 accent-[hsl(220_70%_28%)]" />
            Published (visible on site)
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update' : 'Add Entry'}</Button>
            {editing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
          {status && <p className="field-error">{status}</p>}
        </form>
      </section>

      {/* List */}
      <section>
        <p className="mono-label mb-3">[ {initialHosted.length} Entr{initialHosted.length === 1 ? 'y' : 'ies'} ]</p>
        {initialHosted.length === 0 ? (
          <p className="border border-line bg-ink-800 p-6 text-sm text-muted">
            No hosted entries yet. Add real artists/brands you&apos;ve worked with — the public
            section stays hidden until at least one is published.
          </p>
        ) : (
          <div className="space-y-3">
            {initialHosted.map((h, i) => (
              <div key={h.id} className="flex flex-wrap items-start gap-4 border border-line bg-ink-800 p-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-line bg-ink-700">
                  {h.image_url ? (
                    <Image src={h.image_url} alt="" fill sizes="64px" className="object-contain" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={h.published ? 'border-electric/40 text-electric-400' : 'border-line text-muted'}>
                      {h.published ? 'Published' : 'Hidden'}
                    </Badge>
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">#{h.sort_order}</span>
                  </div>
                  <h3 className="mt-1 truncate font-display text-lg uppercase">{h.name}</h3>
                  {h.description && <p className="line-clamp-2 text-xs text-muted">{h.description}</p>}
                  {h.link_url && (
                    <a href={h.link_url} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-[0.65rem] text-electric-400 hover:text-white">
                      {h.link_url}
                    </a>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(h)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => move(i, -1)}>↑</Button>
                  <Button size="sm" variant="outline" onClick={() => move(i, 1)}>↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => togglePublished(h)}>{h.published ? 'Hide' : 'Publish'}</Button>
                  <Button size="sm" variant="hot" onClick={() => remove(h)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
