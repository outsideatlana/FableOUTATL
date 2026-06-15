-- ===================================================================
-- OutsideAtl — optional seed data for local/dev.
-- Run after 0001_init.sql. Safe to run once on an empty DB.
-- ===================================================================

insert into public.events (title, slug, description, event_date, location, status)
values
  (
    'Silent Disco',
    'silent-disco',
    'Three DJs. Three channels. One rooftop full of glowing headphones. Pick your frequency and dance to your own crowd under the Atlanta skyline.',
    now() + interval '21 days',
    'Old Fourth Ward — exact spot drops on RSVP',
    'published'
  ),
  (
    'Rooftop Game Night',
    'rooftop-game-night',
    'Spades, UNO, dominoes, and a DJ keeping the energy right. Golden hour start, city-lights finish. Bring a partner or get drafted.',
    now() + interval '28 days',
    'Midtown rooftop — address sent to the list',
    'published'
  ),
  (
    'Warehouse Rave',
    'warehouse-rave',
    'Raw space, heavy sound system, lights for days. Doors late, ends later. Limited capacity.',
    now() + interval '42 days',
    'West End warehouse — limited capacity',
    'draft'
  )
on conflict (slug) do nothing;
