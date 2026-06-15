import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Anonymous server-side Supabase client for PUBLIC reads in Server
 * Components / route handlers (published events, public recaps, etc).
 *
 * Uses the anon key, so Row Level Security still applies. Returns `null`
 * when Supabase env is not configured, so the app (and `npm run build`)
 * works without secrets — callers fall back to empty data.
 */
export function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** True when public Supabase config is present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
