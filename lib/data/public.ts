import 'server-only';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { EventRow, RecapRow } from '@/types/database';

/**
 * Public, anon-key reads for Server Components. Every function tolerates
 * a missing/misconfigured Supabase and returns a safe empty default, so
 * pages render (and `npm run build` succeeds) without secrets.
 */

export async function getPublishedEvents(): Promise<EventRow[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'sold_out'])
    .order('event_date', { ascending: true });
  if (error) {
    console.error('[data] getPublishedEvents:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .in('status', ['published', 'sold_out'])
    .maybeSingle();
  if (error) {
    console.error('[data] getEventBySlug:', error.message);
    return null;
  }
  return data ?? null;
}

export interface RecapWithEvent extends RecapRow {
  event_title: string | null;
}

export async function getPublicRecaps(): Promise<RecapWithEvent[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('recaps')
    .select('*, events(title)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[data] getPublicRecaps:', error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    const { events, ...rest } = r as RecapRow & { events: { title: string } | null };
    return { ...rest, event_title: events?.title ?? null };
  });
}
