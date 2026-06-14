import 'server-only';
import {
  getAirtableBase,
  isAirtableEnabled,
  tableName,
  type AirtableTableKey,
} from './client';

/**
 * Mirror one record to Airtable. Fire-and-forget by design:
 *  - No-op when sync is disabled (the common case).
 *  - Never throws — a sync failure must NOT break the user's submission,
 *    which is already saved in Supabase (the source of truth).
 */
async function syncRecord(
  key: AirtableTableKey,
  fields: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    if (!isAirtableEnabled()) return;
    const base = await getAirtableBase();
    const name = tableName(key);
    if (!base || !name) {
      console.warn(`[airtable] table name for "${key}" not configured — skipping.`);
      return;
    }
    await base(name).create([{ fields }]);
  } catch (err) {
    console.error(
      `[airtable] sync "${key}" failed (record still saved in Supabase):`,
      err instanceof Error ? err.message : err,
    );
  }
}

export const airtable = {
  enabled: isAirtableEnabled,

  rsvp: (r: { name: string; email: string; phone?: string | null; instagram?: string | null; notes?: string | null; event_title?: string | null }) =>
    syncRecord('rsvps', {
      Name: r.name,
      Email: r.email,
      Phone: r.phone ?? '',
      Instagram: r.instagram ?? '',
      Notes: r.notes ?? '',
      Event: r.event_title ?? '',
    }),

  application: (a: { type: string; name: string; email: string; phone?: string | null; instagram?: string | null; portfolio_url?: string | null; experience?: string | null; message?: string | null }) =>
    syncRecord('applications', {
      Type: a.type,
      Name: a.name,
      Email: a.email,
      Phone: a.phone ?? '',
      Instagram: a.instagram ?? '',
      Portfolio: a.portfolio_url ?? '',
      Experience: a.experience ?? '',
      Message: a.message ?? '',
    }),

  interest: (s: { concept_name: string; name?: string | null; email: string; phone?: string | null }) =>
    syncRecord('signups', {
      Concept: s.concept_name,
      Name: s.name ?? '',
      Email: s.email,
      Phone: s.phone ?? '',
    }),

  event: (e: { title: string; slug: string; event_date?: string | null; location?: string | null; status: string; hero_image_url?: string | null }) =>
    syncRecord('events', {
      Title: e.title,
      Slug: e.slug,
      Date: e.event_date ?? '',
      Location: e.location ?? '',
      Status: e.status,
      'Image URL': e.hero_image_url ?? '',
    }),

  recap: (r: { caption?: string | null; image_url: string; event_title?: string | null }) =>
    syncRecord('recaps', {
      Caption: r.caption ?? '',
      'Image URL': r.image_url,
      Event: r.event_title ?? '',
    }),
};
