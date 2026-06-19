import { z } from 'zod';

/** Treat empty strings / null as "absent" for optional fields. */
const optionalText = (max = 2000) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || v.length <= max, `Too long (max ${max}).`);

const phone = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
  .refine(
    (v) => v == null || /^[+]?[\d\s().-]{7,20}$/.test(v),
    'Enter a valid phone number.',
  );

const email = z.string().trim().min(1, 'Email is required.').email('Enter a valid email.').max(254);
const name = z.string().trim().min(1, 'Name is required.').max(120);

export const rsvpSchema = z.object({
  event_id: z
    .union([z.string().uuid(), z.null(), z.undefined()])
    .transform((v) => (v == null || v === '' ? null : v)),
  name,
  email,
  phone,
  instagram: optionalText(60),
  notes: optionalText(1000),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;

export const applicationSchema = z.object({
  type: z.enum(['intern', 'freelancer', 'vendor', 'dj']),
  name,
  email,
  phone,
  instagram: optionalText(60),
  portfolio_url: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine(
      (v) => v == null || /^https?:\/\/.+/.test(v),
      'Portfolio must be a valid http(s) URL.',
    ),
  experience: optionalText(2000),
  message: optionalText(2000),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

/**
 * Role-specific application form (interns / vendors / dj / sponsors /
 * freelance). Same inputs as the general application minus `type` — the
 * destination table is decided by the route, not the client.
 */
export const roleApplicationSchema = applicationSchema.omit({ type: true });
export type RoleApplicationInput = z.infer<typeof roleApplicationSchema>;

/**
 * Sponsor application / inquiry → Airtable SPONSORS only (never Vendors, never
 * Supabase). Sponsors collect brand-specific fields, so this is its own schema.
 * Required: name + email. `created_at` and `source` are stamped server-side.
 */
export const sponsorApplicationSchema = z.object({
  name,
  email,
  phone,
  instagram: optionalText(60),
  company: optionalText(160),
  website_url: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine(
      (v) => v == null || /^https?:\/\/.+/.test(v),
      'Website must be a valid http(s) URL.',
    ),
  sponsorship_type: optionalText(120),
  budget_range: optionalText(120),
  what_to_sponsor: optionalText(2000),
  message: optionalText(2000),
});
export type SponsorApplicationInput = z.infer<typeof sponsorApplicationSchema>;

/**
 * "What should we throw next?" idea form → Airtable INTEREST FORMS only
 * (never Supabase). Required: name, email, idea title, idea description.
 */
export const interestSchema = z.object({
  name,
  email,
  phone,
  instagram: optionalText(60),
  idea_title: z.string().trim().min(1, 'Tell us your event idea.').max(160),
  idea_description: z
    .string()
    .trim()
    .min(1, 'Describe the vibe — what should we throw?')
    .max(2000),
  preferred_vibe: optionalText(120),
  consent: z.boolean().optional().default(false),
});
export type InterestInput = z.infer<typeof interestSchema>;

/** Newsletter / signup form -> Supabase `signups` + Airtable SIGNUPS. */
export const signupSchema = z.object({
  email,
  phone,
});
export type SignupInput = z.infer<typeof signupSchema>;

/** Optional http(s) URL — empty/null becomes null, otherwise must be a URL. */
const optionalUrl = (label = 'Enter a valid http(s) URL.') =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || /^https?:\/\/.+/i.test(v), label);

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(160),
  subtitle: optionalText(200),
  slug: optionalText(180),
  description: optionalText(4000),
  event_date: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  start_time: optionalText(60),
  end_time: optionalText(60),
  location: optionalText(200),
  venue_name: optionalText(200),
  venue_address: optionalText(300),
  city_state: optionalText(120),
  category: optionalText(80),
  age_restriction: optionalText(60),
  price_label: optionalText(120),
  // Accepts a string[] (form pre-splits) or a newline/comma string (API
  // resilience). Empties dropped; null/undefined -> []. Never throws on shape.
  lineup: z
    .union([z.array(z.string()), z.string(), z.null(), z.undefined()])
    .transform((v) => {
      const parts = Array.isArray(v)
        ? v
        : typeof v === 'string'
          ? v.split(/[\n,]/)
          : [];
      return parts.map((s) => s.trim()).filter(Boolean).slice(0, 60);
    }),
  use_internal_rsvp: z.coerce.boolean().default(true),
  rsvp_url: optionalUrl('RSVP link must be a valid http(s) URL.'),
  ticket_url: optionalUrl('Ticket link must be a valid http(s) URL.'),
  is_featured: z.coerce.boolean().default(false),
  status: z.enum(['draft', 'published', 'sold_out', 'archived']).default('draft'),
  seo_title: optionalText(200),
  seo_description: optionalText(320),
  cta_text: optionalText(80),
  cta_url: optionalUrl('Call-to-action link must be a valid http(s) URL.'),
  hero_image_url: optionalText(1000),
  hero_image_pathname: optionalText(1000),
});
export type EventInput = z.infer<typeof eventSchema>;

/**
 * Map validated input -> `events` table columns (everything except `slug`,
 * which the routes derive/guard themselves). Keeps POST and PATCH in sync so a
 * new field only has to be added in one place.
 */
export function toEventColumns(data: EventInput) {
  return {
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    event_date: data.event_date,
    start_time: data.start_time,
    end_time: data.end_time,
    location: data.location,
    venue_name: data.venue_name,
    venue_address: data.venue_address,
    city_state: data.city_state,
    category: data.category,
    age_restriction: data.age_restriction,
    price_label: data.price_label,
    lineup: data.lineup,
    use_internal_rsvp: data.use_internal_rsvp,
    rsvp_url: data.rsvp_url,
    ticket_url: data.ticket_url,
    is_featured: data.is_featured,
    status: data.status,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
    cta_text: data.cta_text,
    cta_url: data.cta_url,
    hero_image_url: data.hero_image_url,
    hero_image_pathname: data.hero_image_pathname,
  };
}

/**
 * Recommended public-facing fields for a *published* event. Used to warn the
 * admin (never to block) what's missing before going live — empty values fall
 * back to neutral copy on the page, so we never force fake data in.
 */
export const PUBLISH_RECOMMENDED: { key: keyof EventInput; label: string }[] = [
  { key: 'event_date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'venue_name', label: 'Venue' },
  { key: 'hero_image_url', label: 'Poster image' },
];

/** Names of recommended fields that are empty — for the admin "missing" hint. */
export function missingForPublish(input: {
  event_date?: unknown;
  description?: unknown;
  venue_name?: unknown;
  hero_image_url?: unknown;
}): string[] {
  return PUBLISH_RECOMMENDED.filter(({ key }) => {
    const v = (input as Record<string, unknown>)[key];
    return v == null || (typeof v === 'string' && v.trim() === '');
  }).map((f) => f.label);
}

export const recapMetaSchema = z.object({
  event_id: z
    .union([z.string().uuid(), z.null(), z.undefined()])
    .transform((v) => (v == null || v === '' ? null : v)),
  caption: optionalText(280),
  sort_order: z.coerce.number().int().min(0).max(10000).default(0),
});
export type RecapMetaInput = z.infer<typeof recapMetaSchema>;

/** "Who We've Hosted" entry (create + update). Image already uploaded to Storage. */
export const hostedSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  image_url: optionalText(1000),
  image_pathname: optionalText(1000),
  description: optionalText(500),
  link_url: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || /^https?:\/\/.+/.test(v), 'Link must be a valid http(s) URL.'),
  sort_order: z.coerce.number().int().min(0).max(10000).default(0),
  published: z.boolean().default(true),
});
export type HostedInput = z.infer<typeof hostedSchema>;

/** Flatten zod errors into a { field: message } map for the UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
