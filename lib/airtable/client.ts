import 'server-only';
import { AIRTABLE_FORM_MAPS, type FormFieldMap, type FormKey } from './form-field-maps';

/**
 * Centralized, SERVER-ONLY Airtable client for every site form.
 *
 * Records are built from lib/airtable/form-field-maps.ts (the single source of
 * truth for table + exact column names) and written via the REST API:
 *   https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}
 *
 * SECURITY: `import 'server-only'` guarantees AIRTABLE_API_KEY never reaches
 * the browser. Forms only ever call same-origin /api routes that use this
 * module — never Airtable directly. Errors name the table (and Airtable's
 * field-level detail) but never include the API key.
 */

const AIRTABLE_BASE_DEFAULT = 'appfq5XK6vJpwDCyg';

/** Optional admin mirror tables (Supabase is their source of truth). */
const MIRROR_TABLES = {
  events: { id: 'tblrEbVytWDdOSDIL', name: 'Events', env: 'AIRTABLE_EVENTS_TABLE' },
  recaps: { id: 'tblNoY2A79WImyoab', name: 'Recaps', env: 'AIRTABLE_RECAPS_TABLE' },
} as const;
export type MirrorKey = keyof typeof MIRROR_TABLES;

function baseId(): string {
  return process.env.AIRTABLE_BASE_ID || AIRTABLE_BASE_DEFAULT;
}

/**
 * True when an API key is present. The base id and every table identifier
 * resolve from defaults, so configuration hinges only on the secret API key.
 */
export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY);
}

/** ENABLE_AIRTABLE_SYNC gates only the OPTIONAL admin events/recaps mirror. */
export function isAirtableEnabled(): boolean {
  return (
    String(process.env.ENABLE_AIRTABLE_SYNC).toLowerCase() === 'true' &&
    isAirtableConfigured()
  );
}

/** Join non-empty labelled parts into one readable multiline note. */
export function note(parts: Array<[string, unknown]>): string {
  return parts
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([label, v]) => `${label}: ${String(v).trim()}`)
    .join('\n');
}

/** Resolve a form's table identifier: env override (exact name or id) → table id. */
function formTableRef(key: FormKey): string {
  const m = AIRTABLE_FORM_MAPS[key];
  return process.env[m.tableEnv]?.trim() || m.tableId;
}

/** Resolve a mirror table identifier. */
function mirrorTableRef(key: MirrorKey): string {
  const m = MIRROR_TABLES[key];
  return process.env[m.env]?.trim() || m.id;
}

/**
 * Low-level: create one record in a table (by name or id). Throws on any
 * non-2xx, with a message that names the table + Airtable's response detail
 * (which fields/values it rejected) — never the API key.
 */
async function createRecord(
  ref: string,
  label: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) throw new Error('AIRTABLE_API_KEY is not configured.');

  const url = `https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(ref)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Airtable write to "${label}" failed (${res.status}): ${detail.slice(0, 400)}`);
  }
}

/** Build the exact Airtable field payload for a form from its map + input values. */
function buildFields(key: FormKey, values: Record<string, unknown>): Record<string, unknown> {
  const map: FormFieldMap = AIRTABLE_FORM_MAPS[key];
  const out: Record<string, unknown> = {};
  const has = (v: unknown) => v != null && !(typeof v === 'string' && v.trim() === '');

  // Primary column mirrors one logical input.
  if (has(values[map.primary.from])) out[map.primary.field] = values[map.primary.from];

  // Each mapped input → its exact Airtable column (empty values omitted, so we
  // never blank a column and only ever submit fields that exist in the table).
  for (const [logicalKey, column] of Object.entries(map.fields)) {
    if (has(values[logicalKey])) out[column] = values[logicalKey];
  }

  if (map.constants) Object.assign(out, map.constants);
  return out;
}

/** Generic form submit: map + build + write. */
async function submitForm(key: FormKey, values: Record<string, unknown>): Promise<void> {
  const map: FormFieldMap = AIRTABLE_FORM_MAPS[key];
  await createRecord(formTableRef(key), map.table, buildFields(key, values));
}

// ───────────────────────── Per-form submissions ─────────────────────────

/** RSVP form → RSVPs. */
export function submitRsvp(r: {
  name: string;
  email: string;
  phone?: string | null;
  instagram?: string | null;
  notes?: string | null;
  event_title?: string | null;
}): Promise<void> {
  return submitForm('rsvp', {
    name: r.name,
    email: r.email,
    phone: r.phone,
    instagram: r.instagram,
    event: r.event_title,
    notes: r.notes,
  });
}

/** Newsletter / join-the-list form → Signups. */
export function submitSignup(s: { email: string }): Promise<void> {
  return submitForm('signup', { email: s.email });
}

/** Gauge My Interest / "What should we throw next?" → Interest Forms. */
export function submitInterest(s: {
  name: string;
  email: string;
  phone?: string | null;
  instagram?: string | null;
  idea_title: string;
  idea_description: string;
  preferred_vibe?: string | null;
  consent?: boolean;
}): Promise<void> {
  return submitForm('interest', {
    name: s.name,
    email: s.email,
    phone: s.phone,
    instagram: s.instagram,
    ideaTitle: s.idea_title,
    description: s.idea_description,
    preferredVibe: s.preferred_vibe,
    consent: s.consent ? 'Yes' : 'No', // "Consent To Contact" is a singleSelect
  });
}

export interface ApplicationFields {
  name: string;
  email: string;
  phone?: string | null;
  instagram?: string | null;
  portfolio_url?: string | null;
  experience?: string | null;
  message?: string | null;
}

/** General application fallback → Applications. */
export function submitApplication(a: ApplicationFields & { role?: string | null }): Promise<void> {
  return submitForm('application', {
    name: a.name,
    email: a.email,
    role: a.role,
    phone: a.phone,
    instagram: a.instagram,
    portfolio: a.portfolio_url,
    experience: a.experience,
    message: a.message,
  });
}

/** Role-specific application → Interns / Vendors / Dj / Sponsors / Freelance. */
export function submitRoleApplication(
  key: Extract<FormKey, 'interns' | 'vendors' | 'dj' | 'sponsors' | 'freelance'>,
  a: ApplicationFields,
): Promise<void> {
  return submitForm(key, {
    name: a.name,
    email: a.email,
    phone: a.phone,
    instagram: a.instagram,
    portfolio: a.portfolio_url,
    experience: a.experience,
    message: a.message,
  });
}

/** Optional admin mirror (Events / Recaps). Throws on failure; caller swallows. */
export function createMirrorRecord(key: MirrorKey, fields: Record<string, unknown>): Promise<void> {
  return createRecord(mirrorTableRef(key), MIRROR_TABLES[key].name, fields);
}
