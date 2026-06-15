-- ===================================================================
-- "Who We've Hosted" (admin-managed) + newsletter signups + media bucket.
-- Idempotent. Run after 0001/0002. (Already applied to the FableOUTATL
-- project via the Supabase MCP.)
-- ===================================================================

-- Newsletter / signup submissions (Airtable SIGNUPS mirror; Supabase = SoT).
create table if not exists public.signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  phone      text,
  created_at timestamptz not null default now()
);

-- Admin-managed "Who We've Hosted" entries.
create table if not exists public.hosted (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  image_url      text,
  image_pathname text,
  description    text,
  link_url       text,
  sort_order     integer not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists hosted_sort_idx on public.hosted (sort_order);

alter table public.signups enable row level security;
alter table public.hosted  enable row level security;

drop policy if exists "signups_public_insert" on public.signups;
create policy "signups_public_insert" on public.signups for insert with check (true);

-- Public reads only PUBLISHED hosted rows (anon key). Admin writes use the
-- service role (bypasses RLS).
drop policy if exists "hosted_public_read" on public.hosted;
create policy "hosted_public_read" on public.hosted for select using (published);

-- Public Storage bucket for images (events, recaps, hosted logos).
insert into storage.buckets (id, name, public)
values ('media','media', true)
on conflict (id) do update set public = true;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');
