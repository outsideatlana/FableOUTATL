import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type {
  AdminHiddenRecordRow,
  ApplicationRow,
  ApplicationType,
  EventRow,
  HiddenSourceTable,
  HostedRow,
  RecapRow,
  RsvpRow,
} from '@/types/database';

/**
 * Ids that admins have hidden from the dashboard for a given source table.
 * Returns an empty set on any error (e.g. the table not migrated yet) so the
 * admin view degrades gracefully rather than going blank. Airtable is never
 * consulted or modified here.
 */
async function getHiddenRecordIds(source: HiddenSourceTable): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from('admin_hidden_records')
    .select('source_record_id')
    .eq('source_table', source);
  if (error) {
    console.error('[admin-data] hidden ids:', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.source_record_id as string));
}

/**
 * Privileged reads for the admin dashboard (service role, bypasses RLS).
 * Only ever called from pages/routes that already verified an admin
 * session. Returns empty defaults when Supabase is unconfigured.
 */

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
  const { data: rsvps } = await supabase.from('rsvps').select('event_id');
  const counts = new Map<string, number>();
  for (const r of rsvps ?? []) {
    if (r.event_id) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
  }
  return (events ?? []).map((e) => ({ ...e, rsvp_count: counts.get(e.id) ?? 0 }));
}

export interface AdminRsvp extends RsvpRow {
  event_title: string | null;
}

export async function getAdminRsvps(eventId?: string): Promise<AdminRsvp[]> {
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
  const hidden = await getHiddenRecordIds('RSVPS');
  return (data ?? [])
    .filter((r) => !hidden.has(r.id))
    .map((r) => {
      const { events, ...rest } = r as RsvpRow & { events: { title: string } | null };
      return { ...rest, event_title: events?.title ?? null };
    });
}

export async function getAdminApplications(
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
  const hidden = await getHiddenRecordIds('APPLICATIONS');
  return (data ?? []).filter((a) => !hidden.has(a.id));
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

export interface HiddenRecord extends AdminHiddenRecordRow {
  /** Human label looked up from the still-present source row, if available. */
  label: string;
}

/**
 * All records currently hidden from the dashboard, newest first, with a
 * human-readable label resolved from the underlying (un-deleted) Supabase
 * rows. Powers the "Hidden Records" restore view.
 */
export async function getHiddenRecords(): Promise<HiddenRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('admin_hidden_records')
    .select('*')
    .order('hidden_at', { ascending: false });
  if (error) {
    console.error('[admin-data] hidden records:', error.message);
    return [];
  }
  const rows = (data ?? []) as AdminHiddenRecordRow[];

  const idsByTable = (t: HiddenSourceTable) =>
    rows.filter((r) => r.source_table === t).map((r) => r.source_record_id);
  const labels = new Map<string, string>();

  const rsvpIds = idsByTable('RSVPS');
  if (rsvpIds.length > 0) {
    const { data: rs } = await supabase.from('rsvps').select('id, name, email').in('id', rsvpIds);
    for (const r of rs ?? []) labels.set(`RSVPS:${r.id}`, `${r.name} · ${r.email}`);
  }
  const appIds = idsByTable('APPLICATIONS');
  if (appIds.length > 0) {
    const { data: as } = await supabase.from('applications').select('id, name, email').in('id', appIds);
    for (const a of as ?? []) labels.set(`APPLICATIONS:${a.id}`, `${a.name} · ${a.email}`);
  }

  return rows.map((r) => ({
    ...r,
    label: labels.get(`${r.source_table}:${r.source_record_id}`) ?? r.source_record_id,
  }));
}
