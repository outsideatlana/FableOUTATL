/**
 * Canonical OutsideAtl logo asset URLs.
 *
 * Logos are served from the PUBLIC Supabase Storage `media` bucket — the same
 * bucket Supabase already serves photos/events/recaps/hosted from. They are NOT
 * bundled locally and NOT on Vercel Blob (Supabase owns all media files).
 *
 * Override per-environment with the NEXT_PUBLIC_* vars; otherwise fall back to
 * the known public URLs so the brand always renders. NEXT_PUBLIC_* values are
 * safe to expose to the browser (no secrets).
 */
export const OUTSIDEATL_LOGO_URL =
  process.env.NEXT_PUBLIC_OUTSIDEATL_LOGO_URL ||
  'https://dpenkeevywzfqapqubso.supabase.co/storage/v1/object/public/media/outsideatllogo.jpg';

export const OUTSIDEATL_TRANSPARENT_LOGO_URL =
  process.env.NEXT_PUBLIC_OUTSIDEATL_TRANSPARENT_LOGO_URL ||
  'https://dpenkeevywzfqapqubso.supabase.co/storage/v1/object/public/media/transparentoalogo.png';
