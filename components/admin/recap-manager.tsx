'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { AdminRecap } from '@/lib/data/admin';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { uploadImageToBlob } from '@/lib/blob/client';

interface EventOption {
  id: string;
  title: string;
}

export function RecapManager({
  initialRecaps,
  eventOptions,
}: {
  initialRecaps: AdminRecap[];
  eventOptions: EventOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setStatus('');
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get('image');
    const caption = String(fd.get('caption') || '');
    const event_id = String(fd.get('event_id') || '');
    try {
      if (!(file instanceof File) || file.size === 0) {
        setErrors({ image: 'Choose an image to upload.' });
        setStatus('An image is required.');
        return;
      }
      // 1) Upload the image to Vercel Blob (client → /api/upload server upload).
      const blob = await uploadImageToBlob({ file, folder: 'recaps' });
      // 2) Save recap metadata (with the blob url + pathname) to Supabase.
      const res = await fetch('/api/recaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: blob.url,
          image_pathname: blob.pathname,
          caption,
          event_id: event_id || null,
          sort_order: initialRecaps.length,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.fields ?? {});
        setStatus(body.error ?? 'Could not save the recap.');
        return;
      }
      form.reset();
      setPreview('');
      router.refresh();
    } catch (err) {
      // Validation errors from the upload helper (type / 4.5MB) land here.
      setStatus(err instanceof Error ? err.message : 'Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function saveCaption(id: string, caption: string, event_id: string) {
    await fetch(`/api/recaps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, event_id: event_id || null }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this recap photo?')) return;
    await fetch(`/api/recaps/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= initialRecaps.length) return;
    const reordered = [...initialRecaps];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const order = reordered.map((r, i) => ({ id: r.id, sort_order: i }));
    await fetch('/api/recaps/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <section className="border border-line bg-ink-800 p-6 lg:sticky lg:top-20">
        <p className="mono-label">[ New Recap Photo ]</p>
        <h2 className="mb-4 mt-1 font-display text-2xl uppercase">Upload Recap</h2>
        <form onSubmit={onUpload} className="space-y-4" noValidate>
          <Field label="Photo" htmlFor="rc-img" hint="Required · JPG, PNG, WEBP, GIF · max 4.5MB" error={errors.image}>
            <input
              id="rc-img"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : '');
              }}
              className="field-input cursor-pointer file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1 file:font-mono file:text-[0.6rem] file:uppercase file:text-white"
              required
            />
          </Field>
          {preview && (
            <div className="relative aspect-video overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <Field label="Event (optional)" htmlFor="rc-event">
            <Select id="rc-event" name="event_id" defaultValue="">
              <option value="">— No event —</option>
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Caption (optional)" htmlFor="rc-cap" error={errors.caption}>
            <Input id="rc-cap" name="caption" maxLength={280} />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Add Recap Photo'}</Button>
          {status && <p className="field-error">{status}</p>}
        </form>
      </section>

      <section>
        <p className="mono-label mb-3">[ {initialRecaps.length} Photo{initialRecaps.length === 1 ? '' : 's'} ]</p>
        {initialRecaps.length === 0 ? (
          <p className="border border-line bg-ink-800 p-6 text-sm text-muted">No recap photos yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {initialRecaps.map((r, i) => (
              <RecapCard
                key={r.id}
                recap={r}
                eventOptions={eventOptions}
                onSave={saveCaption}
                onDelete={remove}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RecapCard({
  recap,
  eventOptions,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  recap: AdminRecap;
  eventOptions: EventOption[];
  onSave: (id: string, caption: string, eventId: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [caption, setCaption] = useState(recap.caption ?? '');
  const [eventId, setEventId] = useState(recap.event_id ?? '');

  return (
    <div className="flex flex-col border border-line bg-ink-800">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-700">
        <Image src={recap.image_url} alt={recap.caption ?? ''} fill sizes="(max-width:640px) 100vw, 320px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" maxLength={280} />
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">— No event —</option>
          {eventOptions.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </Select>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onSave(recap.id, caption, eventId)}>Save</Button>
          <Button size="sm" variant="outline" onClick={onMoveUp}>↑</Button>
          <Button size="sm" variant="outline" onClick={onMoveDown}>↓</Button>
          <Button size="sm" variant="hot" onClick={() => onDelete(recap.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
