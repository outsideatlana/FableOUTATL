-- ===================================================================
-- Admin "soft delete" / hide list for dashboard log tables.
--
-- Lets an admin REMOVE an RSVP or Application from the admin dashboard
-- view WITHOUT deleting anything. We never touch Airtable here, and we
-- never delete the underlying Supabase row — we only record that a given
-- (source_table, source_record_id) should be filtered out of admin reads.
-- "Restore" simply deletes the matching row from this table.
--
-- Idempotent. Run after 0001/0002/0003.
-- ===================================================================

create table if not exists public.admin_hidden_records (
  id               uuid primary key default gen_random_uuid(),
  -- Which dashboard log table the hidden record belongs to ('rsvps' | 'applications').
  source_table     text not null,
  -- The Supabase row id of the hidden record (stored as text to stay generic).
  source_record_id text not null,
  -- Optional audit fields.
  hidden_by        text,
  hidden_at        timestamptz not null default now(),
  reason           text
);

-- A record can only be hidden once per source table. Lets us upsert/ignore
-- duplicates and delete by the natural key on restore.
create unique index if not exists admin_hidden_records_source_key
  on public.admin_hidden_records (source_table, source_record_id);

-- RLS on, with NO public policies. Only the service role (used exclusively
-- by authenticated admin server routes) can read/write this table. The anon
-- key — and therefore the browser — has no access.
alter table public.admin_hidden_records enable row level security;
