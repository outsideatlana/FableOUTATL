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

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(160),
  slug: optionalText(180),
  description: optionalText(4000),
  event_date: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  location: optionalText(200),
  status: z.enum(['draft', 'published', 'sold_out', 'archived']).default('draft'),
  hero_image_url: optionalText(1000),
  hero_image_pathname: optionalText(1000),
});
export type EventInput = z.infer<typeof eventSchema>;

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
