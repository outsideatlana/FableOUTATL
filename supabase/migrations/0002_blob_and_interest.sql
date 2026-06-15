-- ===================================================================
-- Vercel Blob columns + expanded "what should we throw next?" idea form.
-- Idempotent — safe to run on an existing database. Run after 0001_init.sql.
-- ===================================================================

-- Event images (hero + flyer) — store both the public URL and the blob
-- pathname so the blob can be deleted on remove/replace.
alter table public.events
  add column if not exists hero_image_url text,
  add column if not exists hero_image_pathname text,
  add column if not exists flyer_image_url text,
  add column if not exists flyer_image_pathname text;

-- Recaps (create if missing, then ensure blob columns exist).
create table if not exists public.recaps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events (id) on delete set null,
  image_url   text not null,
  image_pathname text,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.recaps
  add column if not exists image_pathname text;

-- Interest / idea form fields.
alter table public.interest_signups
  add column if not exists instagram text,
  add column if not exists idea_title text,
  add column if not exists idea_description text,
  add column if not exists preferred_vibe text,
  add column if not exists consent boolean not null default false;
