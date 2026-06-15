import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Privileged Supabase client using the SERVICE ROLE key.
 *
 * SECURITY: the service role key bypasses Row Level Security and must
 * NEVER reach the browser. This module imports `server-only`, so any
 * accidental client import fails the build. Only use inside route
 * handlers / server actions that have already verified an admin session.
 *
 * Returns `null` when not configured so the build works without secrets.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Like getSupabaseAdmin but throws — use in admin routes where config is required. */
export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(
      'Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return client;
}
