import 'server-only';

/**
 * Airtable is OPTIONAL and SERVER-ONLY. It is controlled entirely by env:
 * nothing here runs unless ENABLE_AIRTABLE_SYNC=true and credentials exist.
 *
 * SECURITY: AIRTABLE_API_KEY never reaches the browser (server-only import).
 * The `airtable` SDK is loaded lazily so the app builds and runs fine when
 * sync is disabled or the package/credentials are absent.
 */

export function isAirtableEnabled(): boolean {
  return (
    String(process.env.ENABLE_AIRTABLE_SYNC).toLowerCase() === 'true' &&
    Boolean(process.env.AIRTABLE_API_KEY) &&
    Boolean(process.env.AIRTABLE_BASE_ID)
  );
}

export type AirtableTableKey =
  | 'events'
  | 'rsvps'
  | 'applications'
  | 'recaps'
  | 'signups'
  | 'interest';

const TABLE_ENV: Record<AirtableTableKey, string> = {
  events: 'AIRTABLE_EVENTS_TABLE',
  rsvps: 'AIRTABLE_RSVP_TABLE',
  applications: 'AIRTABLE_APPLICATIONS_TABLE',
  recaps: 'AIRTABLE_RECAPS_TABLE',
  signups: 'AIRTABLE_SIGNUPS_TABLE',
  interest: 'AIRTABLE_INTEREST_TABLE',
};

export function tableName(key: AirtableTableKey): string | null {
  return process.env[TABLE_ENV[key]] || null;
}

/**
 * Lazily build an Airtable base handle. Returns null when disabled.
 * The dynamic import means `airtable` is only required at runtime when used.
 */
export async function getAirtableBase() {
  if (!isAirtableEnabled()) return null;
  const { default: Airtable } = await import('airtable');
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID as string,
  );
}
