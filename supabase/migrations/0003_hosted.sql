-- ===================================================================
-- "Who We've Hosted" — admin-managed hosted artists / brands.
-- Run after 0002. Idempotent.
-- ===================================================================

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

alter table public.hosted enable row level security;

-- Public can read only PUBLISHED entries (anon key). Admin create/update/
-- delete go through server routes using the service role (bypasses RLS).
drop policy if exists "hosted_public_read" on public.hosted;
create policy "hosted_public_read" on public.hosted
  for select using (published);
