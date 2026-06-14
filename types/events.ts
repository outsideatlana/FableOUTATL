import type { EventRow, EventStatus, RecapRow } from './database';

export type { EventRow, EventStatus, RecapRow };

/** A concept card used on the homepage to gauge interest. */
export interface EventConcept {
  name: string;
  tagline: string;
  description: string;
}

/** Human-readable label + tailwind classes for an event status badge. */
export const EVENT_STATUS_META: Record<
  EventStatus,
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'text-muted border-line' },
  published: { label: 'Live', className: 'text-electric-400 border-electric/40' },
  sold_out: { label: 'Sold Out', className: 'text-hot-400 border-hot/40' },
  archived: { label: 'Archived', className: 'text-muted border-line' },
};
