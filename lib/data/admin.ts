import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type {
  ApplicationRow,
  ApplicationType,
  EventRow,
  HiddenSourceTable,
  HostedRow,
  RecapRow,
  RsvpRow,
} from '@/types/database';

/**
 * Privileged reads for the admin dashboard (service role, bypasses RLS).
 * Only ever called from pages/routes that already verified an admin
 * session. Returns empty defaults when Supabase is unconfigured.
 */

/**
 * Set of Supabase row ids that an admin has "hidden" (soft-deleted) from the
 * dashboard for a given log table. The underlying rows — and their Airtable
 * mirrors — are left untouched; we only filter these out on display.
 */
export async function getHiddenRecordIds(
  sourceTable: HiddenSourceTable,
): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from('admin_hidden_records')
    .select('source_record_id')
    .eq('source_table', sourceTable);
  if (error) {
    console.error('[admin-data] hidden ids:', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.source_record_id));
}

export interface AdminEvent extends EventRow {
  rsvp_count: number;
}

export async function getAdminEvents(): Promise<AdminEvent[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });
  if (error) {
    console.error('[admin-data] events:', error.message);
    return [];
  }
  // Count only VISIBLE RSVPs — same hidden-list (local Supabase row id)
  // exclusion used by getAdminRsvps, so per-event counts stay in sync.
  const [{ data: rsvps }, hidden] = await Promise.all([
    supabase.from('rsvps').select('id, event_id'),
    getHiddenRecordIds('rsvps'),
  ]);
  const counts = new Map<string, number>();
  for (const r of rsvps ?? []) {
    if (hidden.has(r.id)) continue;
    if (r.event_id) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
  }
  return (events ?? []).map((e) => ({ ...e, rsvp_count: counts.get(e.id) ?? 0 }));
}

export interface AdminRsvp extends RsvpRow {
  event_title: string | null;
}

async function fetchRsvpRows(eventId?: string): Promise<AdminRsvp[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase
    .from('rsvps')
    .select('*, events(title)')
    .order('created_at', { ascending: false });
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) {
    console.error('[admin-data] rsvps:', error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    const { events, ...rest } = r as RsvpRow & { events: { title: string } | null };
    return { ...rest, event_title: events?.title ?? null };
  });
}

/** Visible RSVPs only — admin-hidden rows are filtered out. */
export async function getAdminRsvps(eventId?: string): Promise<AdminRsvp[]> {
  const [rows, hidden] = await Promise.all([
    fetchRsvpRows(eventId),
    getHiddenRecordIds('rsvps'),
  ]);
  return rows.filter((r) => !hidden.has(r.id));
}

/** Only the RSVPs an admin has hidden — used by the restore view. */
export async function getHiddenAdminRsvps(): Promise<AdminRsvp[]> {
  const [rows, hidden] = await Promise.all([
    fetchRsvpRows(),
    getHiddenRecordIds('rsvps'),
  ]);
  return rows.filter((r) => hidden.has(r.id));
}

async function fetchApplicationRows(
  type?: ApplicationType,
): Promise<ApplicationRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) {
    console.error('[admin-data] applications:', error.message);
    return [];
  }
  return data ?? [];
}

/** Visible applications only — admin-hidden rows are filtered out. */
export async function getAdminApplications(
  type?: ApplicationType,
): Promise<ApplicationRow[]> {
  const [rows, hidden] = await Promise.all([
    fetchApplicationRows(type),
    getHiddenRecordIds('applications'),
  ]);
  return rows.filter((r) => !hidden.has(r.id));
}

/** Only the applications an admin has hidden — used by the restore view. */
export async function getHiddenAdminApplications(): Promise<ApplicationRow[]> {
  const [rows, hidden] = await Promise.all([
    fetchApplicationRows(),
    getHiddenRecordIds('applications'),
  ]);
  return rows.filter((r) => hidden.has(r.id));
}

export interface AdminRecap extends RecapRow {
  event_title: string | null;
}

export async function getAdminRecaps(): Promise<AdminRecap[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('recaps')
    .select('*, events(title)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[admin-data] recaps:', error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    const { events, ...rest } = r as RecapRow & { events: { title: string } | null };
    return { ...rest, event_title: events?.title ?? null };
  });
}

export async function getAdminEventOptions(): Promise<Pick<EventRow, 'id' | 'title'>[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase
    .from('events')
    .select('id, title')
    .order('event_date', { ascending: false });
  return data ?? [];
}

export async function getAdminHosted(): Promise<HostedRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hosted')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[admin-data] hosted:', error.message);
    return [];
  }
  return data ?? [];
}
