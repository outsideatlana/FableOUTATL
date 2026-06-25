import { makeRoleApplicationRoute } from '@/lib/forms/application-route';

// POST /api/applications/freelance → Airtable Freelance (+ Supabase mirror).
export const POST = makeRoleApplicationRoute({
  tableKey: 'freelance',
  label: 'Freelancer',
  supabaseType: 'freelancer',
});
