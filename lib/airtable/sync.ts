import 'server-only';
import { createMirrorRecord, isAirtableEnabled, note } from './client';

/**
 * OPTIONAL mirrors of admin-managed Supabase records (Events, Recaps) into
 * Airtable. Supabase is the source of truth for these; mirroring is gated by
 * ENABLE_AIRTABLE_SYNC and a failure is logged and swallowed — never fatal.
 *
 * Site FORM submissions do NOT live here — they go straight to their Airtable
 * table via lib/airtable/client.ts (submitRsvp, submitSignup, submitInterest,
 * submitApplication, submitRoleApplication), mapped by form-field-maps.ts.
 *
 * SECURITY: server-only; AIRTABLE_API_KEY never reaches the browser.
 */
async function mirror(
  key: Parameters<typeof createMirrorRecord>[0],
  fields: Record<string, unknown>,
): Promise<void> {
  try {
    if (!isAirtableEnabled()) return;
    await createMirrorRecord(key, fields);
  } catch (err) {
    console.error(
      `[airtable] mirror "${key}" failed (Supabase remains source of truth):`,
      err instanceof Error ? err.message : err,
    );
  }
}

export const airtable = {
  enabled: isAirtableEnabled,

  // Event metadata mirror (Supabase = source of truth) -> Events.
  event: (e: { title: string; location?: string | null; event_date?: string | null }) =>
    mirror('events', {
      Name: e.title,
      Location: e.location ?? '',
      'Start Date': e.event_date ?? '',
    }),

  // Recap mirror -> Recaps.
  recap: (r: { caption?: string | null; image_url: string }) =>
    mirror('recaps', {
      Name: r.caption || 'Recap',
      Summary: r.caption ?? '',
      Attachment: r.image_url ? [{ url: r.image_url }] : undefined,
    }),
};

export { note };
