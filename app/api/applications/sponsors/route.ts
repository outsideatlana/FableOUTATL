import { makeRoleApplicationRoute } from '@/lib/forms/application-route';

// POST /api/applications/sponsors → Airtable Sponsors.
// No Supabase mirror: there is no 'sponsor' application_type enum value, so
// sponsor inquiries live in Airtable only.
export const POST = makeRoleApplicationRoute({
  tableKey: 'sponsors',
  label: 'Sponsor',
});
