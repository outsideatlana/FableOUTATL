import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Server-side admin login rate limiting, backed by Supabase
 * (public.admin_login_attempts).
 *
 * Blocks an identifier after MAX_ATTEMPTS failed logins within WINDOW_MINUTES.
 * The identifier is "ip:username" (or just ip when username is absent), so a
 * single IP brute-forcing one account is throttled. Everything here is
 * server-only — nothing reaches the browser — and no password is ever stored.
 *
 * Fails OPEN on infrastructure errors (Supabase unconfigured / unreachable):
 * the admin login must stay available, so we log the error (without secrets)
 * and allow the attempt rather than lock the owner out during an outage.
 */

export const MAX_ATTEMPTS = 5;
export const WINDOW_MINUTES = 5;
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;
const TABLE = 'admin_login_attempts';

/** Exact message shown to a rate-limited user (wording is intentional). */
export const RATE_LIMIT_MESSAGE =
  'Wait a minute and try again or contact the site administrator';

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Build the rate-limit identifier: "ip:username" (or ip alone). */
export function buildIdentifier(ip: string, username: string): string {
  return username ? `${ip}:${username}` : ip;
}

/**
 * True when this identifier has reached the failure limit within the window
 * and must be blocked. Returns false (fail-open) when Supabase is unavailable.
 */
export async function isRateLimited(identifier: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('success', false)
    .gte('attempted_at', cutoff);
  if (error) {
    console.error('[auth] rate-limit count failed (allowing):', error.message);
    return false;
  }
  return (count ?? 0) >= MAX_ATTEMPTS;
}

/** Record one login attempt. Best-effort; never throws. */
export async function recordAttempt(identifier: string, success: boolean): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).insert({ identifier, success });
  if (error) console.error('[auth] rate-limit record failed:', error.message);
}

/** Clear failed attempts for an identifier (called after a successful login). */
export async function clearFailures(identifier: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('identifier', identifier)
    .eq('success', false);
  if (error) console.error('[auth] rate-limit clear failed:', error.message);
}
