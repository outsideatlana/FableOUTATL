import 'server-only';
import type Airtable from 'airtable';
import {
  getAirtableBase,
  isAirtableEnabled,
  tableName,
  type AirtableTableKey,
} from './client';

/**
 * Mirror form submissions to Airtable. The local Supabase DB is always the
 * source of truth; Airtable is an optional CRM mirror (ENABLE_AIRTABLE_SYNC).
 *
 * Field names below match the OutsideAtl Airtable base tables (RSVPs,
 * Signups, Applications, Interest Forms, Events, Recaps). `typecast` lets
 * Airtable coerce values (and create select options) so a mismatch never
 * throws. A failed sync is logged and swallowed — never fatal to the user.
 *
 * SECURITY: runs server-only; AIRTABLE_API_KEY never reaches the browser.
 */
async function syncRecord(
  key: AirtableTableKey,
  fields: Record<string, unknown>,
): Promise<void> {
  try {
    if (!isAirtableEnabled()) return;
    const base = await getAirtableBase();
    const name = tableName(key);
    if (!base || !name) {
      console.warn(`[airtable] table for "${key}" not configured — skipping.`);
      return;
    }
    await base(name).create(
      [{ fields: fields as Airtable.FieldSet }],
      { typecast: true },
    );
  } catch (err) {
    console.error(
      `[airtable] sync "${key}" failed (record still saved in Supabase):`,
      err instanceof Error ? err.message : err,
    );
  }
}

/** Join non-empty labelled parts into one multiline note. */
function note(parts: Array<[string, string | null | undefined]>): string {
  return parts
    .filter(([, v]) => v && String(v).trim() !== '')
    .map(([label, v]) => `${label}: ${v}`)
    .join('\n');
}

export const airtable = {
  enabled: isAirtableEnabled,

  // RSVP forms -> RSVPS
  rsvp: (r: {
    name: string;
    email: string;
    phone?: string | null;
    instagram?: string | null;
    notes?: string | null;
    event_title?: string | null;
  }) =>
    syncRecord('rsvps', {
      Name: r.name,
      'Attendee Name': r.name,
      'Attendee Email': r.email,
      Notes: note([
        ['Event', r.event_title],
        ['Phone', r.phone],
        ['Instagram', r.instagram],
        ['Notes', r.notes],
      ]),
    }),

  // Newsletter / signup forms -> SIGNUPS
  signup: (s: { email: string; phone?: string | null; name?: string | null }) =>
    syncRecord('signups', {
      Name: s.name || s.email,
      'Attendee Name': s.name ?? '',
      'Attendee Email': s.email,
    }),

  // Applications -> APPLICATIONS
  application: (a: {
    type: string;
    name: string;
    email: string;
    phone?: string | null;
    instagram?: string | null;
    portfolio_url?: string | null;
    experience?: string | null;
    message?: string | null;
  }) =>
    syncRecord('applications', {
      Name: a.name,
      'Applicant Name': a.name,
      'Applicant Email': a.email,
      'Application Notes': note([
        ['Type', a.type],
        ['Phone', a.phone],
        ['Instagram', a.instagram],
        ['Portfolio', a.portfolio_url],
        ['Experience', a.experience],
        ['Message', a.message],
      ]),
    }),

  // "What should we throw next?" / Gauge My Interest -> INTEREST FORMS
  interest: (s: {
    concept_name: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  }) =>
    syncRecord('interest', {
      Name: s.name || s.concept_name,
      'Attendee Name': s.name ?? '',
      'Attendee Email': s.email,
      'Suggested Event/Activity': s.concept_name,
      'Reason for Suggestion': note([['Phone', s.phone]]),
    }),

  // Optional metadata mirrors (Supabase remains source of truth).
  event: (e: {
    title: string;
    location?: string | null;
    event_date?: string | null;
  }) =>
    syncRecord('events', {
      Name: e.title,
      Location: e.location ?? '',
      'Start Date': e.event_date ?? '',
    }),

  recap: (r: { caption?: string | null; image_url: string }) =>
    syncRecord('recaps', {
      Name: r.caption || 'Recap',
      Summary: r.caption ?? '',
      Attachment: r.image_url ? [{ url: r.image_url }] : undefined,
    }),
};
