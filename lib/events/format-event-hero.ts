import type { EventRow } from '@/types/database';

/**
 * Pure formatter for the flyer-style event hero hierarchy used by the public
 * /events page. EventRow in, plain view-object out — no JSX, no Supabase — so
 * the hero markup stays dumb and this branching logic can be reasoned about
 * (and reused) in isolation.
 *
 * Every field is defensive: missing/empty data collapses to the project's
 * approved fallback copy, and rows with no real data return `null` so the
 * caller can omit them entirely rather than render an empty line.
 */

/** The subset of an event the hero hierarchy reads. */
export type EventHeroInput = Pick<
  EventRow,
  'title' | 'event_date' | 'start_time' | 'end_time' | 'venue_name' | 'city_state' | 'lineup'
>;

export interface EventHeroView {
  /** Static label, shown exactly as written. */
  presents: string;
  /** "9:00 PM – 4:00 AM" | "9:00 PM" | "Time TBA". */
  timeStr: string;
  /** Event title — never empty (falls back to "OutsideAtl Event"). */
  title: string;
  /** First lineup name, or "Lineup coming soon." when there's no lineup. */
  headliner: string;
  /** Main DJs (lineup positions 2–4) joined by " X ", or null if none. */
  mainStr: string | null;
  /** Supporting DJs (lineup position 5+) as "+ A . B", or null if none. */
  supportStr: string | null;
  /** Weekday, e.g. "FRIDAY", or null when the date is missing/invalid. */
  dayLabel: string | null;
  /** Month + day, e.g. "JULY 12", or null when the date is missing/invalid. */
  dateLabel: string | null;
  /** venue_name → city_state → "Venue to be announced." */
  locationLabel: string;
  /** "FRIDAY · JULY 12 · THE VENUE" | "DATE TBA · VENUE TO BE ANNOUNCED." */
  dayDateLocation: string;
}

const WEEKDAYS = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
] as const;
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
] as const;

/** Trim + drop blanks/non-strings so we never render an empty DJ token. */
function cleanLineup(lineup: unknown): string[] {
  if (!Array.isArray(lineup)) return [];
  return lineup.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

/** Parse the stored ISO timestamp; null on missing/garbage input. */
function parseEventDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatEventHero(event: EventHeroInput): EventHeroView {
  // ---- Time: both → range, start only → start, neither → TBA ----
  const start = event.start_time?.trim() ?? '';
  const end = event.end_time?.trim() ?? '';
  const timeStr = start && end ? `${start} – ${end}` : start || 'Time TBA';

  // ---- Title ----
  const title = event.title?.trim() || 'OutsideAtl Event';

  // ---- Lineup → headliner / main / supporting ----
  const lineup = cleanLineup(event.lineup);
  const headliner = lineup[0] || 'Lineup coming soon.';
  const main = lineup.slice(1, 4); // up to 3 main names after the headliner
  const support = lineup.slice(4); // everyone after that supports
  const mainStr = main.length > 0 ? main.join(' X ') : null;
  const supportStr = support.length > 0 ? `+ ${support.join(' . ')}` : null;

  // ---- Day / Date / Location ----
  const date = parseEventDate(event.event_date);
  const dayLabel = date ? WEEKDAYS[date.getDay()] : null;
  const dateLabel = date ? `${MONTHS[date.getMonth()]} ${date.getDate()}` : null;
  const locationLabel =
    event.venue_name?.trim() || event.city_state?.trim() || 'Venue to be announced.';
  const dayDateLocation = date
    ? `${dayLabel} · ${dateLabel} · ${locationLabel}`.toUpperCase()
    : `DATE TBA · ${locationLabel}`.toUpperCase();

  return {
    presents: 'OutsideAtl Presents',
    timeStr,
    title,
    headliner,
    mainStr,
    supportStr,
    dayLabel,
    dateLabel,
    locationLabel,
    dayDateLocation,
  };
}
