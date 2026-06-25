-- ===================================================================
-- Admin login attempt log — server-side brute-force throttling.
--
-- The admin login API (app/api/auth/login/route.ts) records every attempt
-- here and blocks an identifier after 5 failed attempts within 5 minutes.
-- `identifier` is "ip:username" (or just ip when username is absent). No
-- password is ever stored or logged.
--
-- Written/read ONLY by the service-role admin client used by the login server
-- route. RLS is enabled with NO policies, so the anon key — and therefore the
-- browser — has zero access.
--
-- Idempotent. Run after 0001-0004.
-- ===================================================================

create table if not exists public.admin_login_attempts (
  id           uuid primary key default gen_random_uuid(),
  -- Rate-limit key: "ip:username" (or ip when username is absent).
  identifier   text not null,
  attempted_at timestamptz not null default now(),
  -- Whether this attempt succeeded. Failures count toward the limit.
  success      boolean not null default false
);

-- Fast lookup for "failed attempts for this identifier in the last N minutes".
create index if not exists admin_login_attempts_identifier_time
  on public.admin_login_attempts (identifier, attempted_at desc);

-- RLS on, with NO public policies. Only the service role (used exclusively by
-- the admin login server route) can read/write this table.
alter table public.admin_login_attempts enable row level security;
