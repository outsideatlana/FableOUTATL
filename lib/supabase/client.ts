'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon key only). Safe for client components —
 * uses ONLY NEXT_PUBLIC_* env. Returns null if unconfigured.
 *
 * Note: most data flows go through server API routes; this is here for
 * any client-side public reads you may want later.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  cached = createBrowserClient(url, anonKey);
  return cached;
}
