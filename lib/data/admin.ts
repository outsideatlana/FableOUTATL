import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type {
  ApplicationRow,
  ApplicationType,
  EventRow,
  RecapRow,
  RsvpRow,
} from '@/types/database';

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
  return (data ?? []).map((r) => {
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
  return data ?? [];
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
