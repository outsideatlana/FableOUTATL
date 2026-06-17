import 'server-only';

/**
 * Centralized, SERVER-ONLY Airtable client for every site form.
 *
 * All form submissions go to Airtable via the REST API using the pattern:
 *   https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}
 *
 * `table` is resolved per form from env (e.g. AIRTABLE_INTEREST_TABLE) and
 * falls back to the real table ID from the base (appfq5XK6vJpwDCyg). Falling
 * back to the stable table ID means a missing/mis-cased env value can never
 * reproduce the "INTEREST FORMS table is not configured" error again.
 *
 * SECURITY: `import 'server-only'` guarantees AIRTABLE_API_KEY never reaches
 * the browser. Forms only ever call the /api/* routes that use this module —
 * never Airtable directly from client components.
 *
 * FIELD NAMES: every field key below matches a real column in the base
 * (inspected live). Inputs without a dedicated column are folded into each
 * table's notes/multiline column — no field names are invented.
 */

const AIRTABLE_BASE_DEFAULT = 'appfq5XK6vJpwDCyg';

export type AirtableTableKey =
  | 'rsvps'
  | 'signups'
  | 'applications'
  | 'events'
  | 'recaps'
  | 'interest'
  | 'interns'
  | 'vendors'
  | 'dj'
  | 'sponsors'
  | 'freelance';

/**
 * Registry of every table this app writes to. `id` is the real Airtable table
 * id (casing-proof default); `name` is the human table name; `env` overrides
 * the identifier used in the URL when set.
 */
const TABLES: Record<AirtableTableKey, { id: string; name: string; env: string }> = {
  rsvps:        { id: 'tblMsYOvmcZ3GkxAU', name: 'RSVPs',          env: 'AIRTABLE_RSVP_TABLE' },
  signups:      { id: 'tblHVZAqfwVeiI9NE', name: 'Signups',        env: 'AIRTABLE_SIGNUPS_TABLE' },
  applications: { id: 'tbl2r0WCwcH9H6zxJ', name: 'Applications',   env: 'AIRTABLE_APPLICATIONS_TABLE' },
  events:       { id: 'tblrEbVytWDdOSDIL', name: 'Events',         env: 'AIRTABLE_EVENTS_TABLE' },
  recaps:       { id: 'tblNoY2A79WImyoab', name: 'Recaps',         env: 'AIRTABLE_RECAPS_TABLE' },
  interest:     { id: 'tblxF8FH9U0tANlUu', name: 'Interest Forms', env: 'AIRTABLE_INTEREST_TABLE' },
  interns:      { id: 'tbl3zQWwu4kUxw95E', name: 'Interns',        env: 'AIRTABLE_INTERNS_TABLE' },
  vendors:      { id: 'tblHwCW43Nzf0iNHi', name: 'Vendors',        env: 'AIRTABLE_VENDORS_TABLE' },
  dj:           { id: 'tblBQJ9lOtCFzlLu0', name: 'Dj',             env: 'AIRTABLE_DJ_TABLE' },
  sponsors:     { id: 'tbl76EBA5bnLJGswo', name: 'Sponsors',       env: 'AIRTABLE_SPONSORS_TABLE' },
  freelance:    { id: 'tblgJlCIUCwCDlZIO', name: 'Freelance',      env: 'AIRTABLE_FREELANCE_TABLE' },
};

function baseId(): string {
  return process.env.AIRTABLE_BASE_ID || AIRTABLE_BASE_DEFAULT;
}

/** Identifier placed in the REST URL: env override (name) or the real table id. */
function tableRef(key: AirtableTableKey): string {
  const override = process.env[TABLES[key].env]?.trim();
  return override && override.length > 0 ? override : TABLES[key].id;
}

/** Human-facing table name (used in error messages / docs). */
export function tableName(key: AirtableTableKey): string {
  return TABLES[key].name;
}

/**
 * True when an API key is present. The base id always resolves (env or the
 * known default), so configuration hinges only on the secret API key.
 */
export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY);
}

/** ENABLE_AIRTABLE_SYNC gates the OPTIONAL mirroring of admin events/recaps. */
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

/**
 * Create one record in an Airtable table via the REST API. Throws on any
 * non-2xx response so callers can decide whether the failure is fatal
 * (primary-store forms) or should be swallowed (optional mirrors).
 */
export async function createAirtableRecord(
  key: AirtableTableKey,
  fields: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    throw new Error('AIRTABLE_API_KEY is not configured.');
  }

  // Drop empty values so we never overwrite/clear columns with blanks.
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v != null && !(typeof v === 'string' && v.trim() === '')) clean[k] = v;
  }

  const url = `https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(tableRef(key))}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records: [{ fields: clean }], typecast: true }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Airtable write to "${tableName(key)}" failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }
}

/** Phone numbers as digits-only (the RSVPs "Phone Number" column is numeric). */
function phoneDigits(phone?: string | null): number | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}

// ───────────────────────── Per-form submissions ─────────────────────────
// Each maps the form's inputs onto the matching table's REAL columns.

/** RSVP form → RSVPs. Columns: Name, Attendee Name, Attendee Email, Phone Number, Notes. */
export function submitRsvp(r: {
  name: string;
  email: string;
  phone?: string | null;
  instagram?: string | null;
  notes?: string | null;
  event_title?: string | null;
}): Promise<void> {
  return createAirtableRecord('rsvps', {
    Name: r.name,
    'Attendee Name': r.name,
    'Attendee Email': r.email,
    'Phone Number': phoneDigits(r.phone),
    Notes: note([
      ['Event', r.event_title],
      ['Instagram', r.instagram],
      ['Notes', r.notes],
    ]),
  });
}

/** Newsletter / join-the-list form → Signups. Columns: Name, Attendee Email, Source. */
export function submitSignup(s: { email: string }): Promise<void> {
  return createAirtableRecord('signups', {
    Name: s.email,
    'Attendee Name': s.email,
    'Attendee Email': s.email,
    Source: 'Website',
  });
}

/**
 * Gauge My Interest / "What should we throw next?" → Interest Forms.
 * Columns: Name, Attendee Name, Attendee Email, Suggested Event/Activity,
 * Reason for Suggestion, Source.
 */
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
  return createAirtableRecord('interest', {
    Name: s.name,
    'Attendee Name': s.name,
    'Attendee Email': s.email,
    'Suggested Event/Activity': s.idea_title,
    'Reason for Suggestion': note([
      ['Idea', s.idea_description],
      ['Preferred vibe/day', s.preferred_vibe],
      ['Phone', s.phone],
      ['Instagram', s.instagram],
      ['Consent to be contacted', s.consent ? 'Yes' : 'No'],
    ]),
    Source: 'Website',
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

/** General application fallback → Applications. Columns: Name, Applicant Name, Applicant Email, Role, Application Notes. */
export function submitApplication(a: ApplicationFields & { role?: string | null }): Promise<void> {
  return createAirtableRecord('applications', {
    Name: a.name,
    'Applicant Name': a.name,
    'Applicant Email': a.email,
    Role: a.role ?? undefined,
    'Application Notes': note([
      ['Phone', a.phone],
      ['Instagram', a.instagram],
      ['Portfolio', a.portfolio_url],
      ['Experience', a.experience],
      ['Message', a.message],
    ]),
  });
}

/**
 * Role-specific application → Interns / Vendors / Dj / Sponsors / Freelance.
 * These tables only have Name + Notes (+ Status/Assignee/Attachments), so all
 * applicant detail folds into the real Notes column.
 */
export function submitRoleApplication(
  key: Extract<AirtableTableKey, 'interns' | 'vendors' | 'dj' | 'sponsors' | 'freelance'>,
  a: ApplicationFields,
): Promise<void> {
  return createAirtableRecord(key, {
    Name: a.name,
    Notes: note([
      ['Email', a.email],
      ['Phone', a.phone],
      ['Instagram', a.instagram],
      ['Portfolio', a.portfolio_url],
      ['Experience', a.experience],
      ['Message', a.message],
    ]),
  });
}
