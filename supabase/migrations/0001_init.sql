-- ===================================================================
-- OutsideAtl — initial schema, RLS policies, and storage bucket.
-- Run in the Supabase SQL editor, or via `supabase db push`.
-- ===================================================================

create extension if not exists pgcrypto;

-- ---- Enums --------------------------------------------------------
do $$ begin
  create type event_status as enum ('draft', 'published', 'sold_out', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_type as enum ('intern', 'freelancer', 'vendor', 'dj');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('new', 'reviewed', 'contacted', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

-- ---- Tables -------------------------------------------------------
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text unique not null,
  description    text,
  event_date     timestamptz,
  location       text,
  hero_image_url text,
  status         event_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists events_status_date_idx on public.events (status, event_date);

create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events (id) on delete set null,
  name       text not null,
  email      text not null,
  phone      text,
  instagram  text,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists rsvps_event_idx on public.rsvps (event_id);

create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  type          application_type not null,
  name          text not null,
  email         text not null,
  phone         text,
  instagram     text,
  portfolio_url text,
  experience    text,
  message       text,
  status        application_status not null default 'new',
  created_at    timestamptz not null default now()
);
create index if not exists applications_type_idx on public.applications (type, status);

create table if not exists public.recaps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events (id) on delete set null,
  image_url  text not null,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists recaps_sort_idx on public.recaps (sort_order);

create table if not exists public.interest_signups (
  id           uuid primary key default gen_random_uuid(),
  concept_name text not null,
  name         text,
  email        text not null,
  phone        text,
  created_at   timestamptz not null default now()
);

-- ---- Row Level Security ------------------------------------------
-- The app's server routes use the SERVICE ROLE key, which BYPASSES RLS.
-- These policies govern the public anon key (browser-reachable). The
-- service role is the only path that can read RSVPs/applications or
-- write events/recaps — keeping admin data private by default.

alter table public.events            enable row level security;
alter table public.rsvps             enable row level security;
alter table public.applications      enable row level security;
alter table public.recaps            enable row level security;
alter table public.interest_signups  enable row level security;

-- Public can READ published / sold-out events.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (status in ('published', 'sold_out'));

-- Public can READ the recap gallery.
drop policy if exists "recaps_public_read" on public.recaps;
create policy "recaps_public_read" on public.recaps
  for select using (true);

-- Public can INSERT submissions (RSVPs, applications, interest).
drop policy if exists "rsvps_public_insert" on public.rsvps;
create policy "rsvps_public_insert" on public.rsvps
  for insert with check (true);

drop policy if exists "applications_public_insert" on public.applications;
create policy "applications_public_insert" on public.applications
  for insert with check (true);

drop policy if exists "signups_public_insert" on public.interest_signups;
create policy "signups_public_insert" on public.interest_signups
  for insert with check (true);

-- NOTE: no public SELECT on rsvps/applications/interest_signups, and no
-- public INSERT/UPDATE/DELETE on events/recaps. Those happen server-side
-- with the service role only.

-- ---- Storage bucket ----------------------------------------------
insert into storage.buckets (id, name, public)
values ('outsideatl-media', 'outsideatl-media', true)
on conflict (id) do nothing;

-- Public read of media objects (event heroes + recap photos).
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'outsideatl-media');

-- Uploads/deletes go through the service role (bypasses RLS), so no anon
-- write policy is granted here — that keeps uploads admin-only.
