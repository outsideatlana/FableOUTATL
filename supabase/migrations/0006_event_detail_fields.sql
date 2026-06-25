-- ===================================================================
-- OutsideAtl — event detail fields.
-- Adds the columns the new event detail page + admin form manage, so an
-- admin can edit every public-facing value without touching code.
--
-- ADDITIVE ONLY: every statement is `add column if not exists`, so this is
-- safe to re-run and never drops or rewrites existing data. Existing columns
-- (title, slug, description, event_date, location, hero_image_url,
-- hero_image_pathname, status, created_at, updated_at) are left untouched —
-- the frontend maps to those rather than duplicating them.
--
-- NOTE on names: the spec's `hero_image_path` is already covered by the
-- existing `hero_image_pathname`; `slug`, `status`, and `updated_at` already
-- exist. The `event_status` enum already includes 'sold_out', which we keep.
-- Run after 0002_blob_pathnames.sql.
-- ===================================================================

alter table public.events
  add column if not exists subtitle          text,
  add column if not exists start_time        text,
  add column if not exists end_time          text,
  add column if not exists venue_name        text,
  add column if not exists venue_address     text,
  add column if not exists city_state        text,
  add column if not exists rsvp_url          text,
  add column if not exists use_internal_rsvp boolean not null default true,
  add column if not exists ticket_url        text,
  add column if not exists age_restriction   text,
  add column if not exists price_label       text,
  add column if not exists lineup            text[] not null default '{}',
  add column if not exists category          text,
  add column if not exists is_featured       boolean not null default false,
  add column if not exists seo_title         text,
  add column if not exists seo_description   text,
  add column if not exists cta_text          text,
  add column if not exists cta_url           text;

-- Fast lookup of the (single) featured, publicly-visible event for the
-- landing hero. Partial index keeps it tiny.
create index if not exists events_featured_idx
  on public.events (is_featured, event_date)
  where is_featured = true;
