-- ===================================================================
-- Add Vercel Blob pathname columns. Storing the pathname (not just the
-- URL) lets the app delete the underlying blob when a record is removed
-- or its image replaced.
-- Run after 0001_init.sql.
-- ===================================================================

alter table public.events
  add column if not exists hero_image_pathname text;

alter table public.recaps
  add column if not exists image_pathname text;
