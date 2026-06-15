-- ===================================================================
-- Admin "hidden records" — soft-delete for the site admin dashboard.
-- Idempotent. Run after 0001/0002/0003.
--
-- Lets admins REMOVE RSVPs / Applications from the admin UI WITHOUT ever
-- touching Airtable. Each row records that a source record (identified by
-- its Supabase id) is hidden from the dashboard. Filtering happens in the
-- admin data layer; the underlying rows and the Airtable mirror are left
-- intact. Restoring simply deletes the matching row here.
-- ===================================================================

create table if not exists public.admin_hidden_records (
  id               uuid primary key default gen_random_uuid(),
  source_table     text not null,         -- 'RSVPS' | 'APPLICATIONS'
  source_record_id text not null,         -- Supabase row id of the hidden record
  hidden_by        text,                  -- admin username (session subject)
  hidden_at        timestamptz not null default now(),
  reason           text,
  unique (source_table, source_record_id)
);

create index if not exists admin_hidden_records_source_idx
  on public.admin_hidden_records (source_table);

-- RLS on, with NO public policies: the anon/auth keys can neither read nor
-- write this table. All access is via the service role (admin API routes),
-- which bypasses RLS — consistent with rsvps/applications having no public
-- SELECT in 0001_init.sql.
alter table public.admin_hidden_records enable row level security;
