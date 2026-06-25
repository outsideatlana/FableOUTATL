import { makeRoleApplicationRoute } from '@/lib/forms/application-route';

// POST /api/applications/interns → Airtable Interns (+ Supabase mirror).
export const POST = makeRoleApplicationRoute({
  tableKey: 'interns',
  label: 'Intern',
  supabaseType: 'intern',
});
