import type {
  ApplicationRow,
  ApplicationStatus,
  ApplicationType,
} from './database';

export type { ApplicationRow, ApplicationStatus, ApplicationType };

export const APPLICATION_TYPES: ApplicationType[] = [
  'intern',
  'freelancer',
  'vendor',
  'dj',
];

export const APPLICATION_TYPE_META: Record<
  ApplicationType,
  { label: string; blurb: string }
> = {
  intern: {
    label: 'Internships',
    blurb: 'Event planning, marketing, content, ops — learn by doing.',
  },
  freelancer: {
    label: 'Freelance Crew',
    blurb: 'Photographers, videographers, designers, production hands.',
  },
  vendor: {
    label: 'Vendors',
    blurb: 'Food, drink, merch, pop-up shops — set up at the next one.',
  },
  dj: {
    label: 'DJs & Artists',
    blurb: 'Send your mix, your set, your sound. We are listening.',
  },
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'new',
  'reviewed',
  'contacted',
  'accepted',
  'rejected',
];

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  new: { label: 'New', className: 'text-electric-400 border-electric/40' },
  reviewed: { label: 'Reviewed', className: 'text-white border-line' },
  contacted: { label: 'Contacted', className: 'text-white border-line' },
  accepted: { label: 'Accepted', className: 'text-green-400 border-green-500/40' },
  rejected: { label: 'Rejected', className: 'text-hot-400 border-hot/40' },
};
