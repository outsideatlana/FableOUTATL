import { makeRoleApplicationRoute } from '@/lib/forms/application-route';

// POST /api/applications/dj → Airtable Dj (+ Supabase mirror).
export const POST = makeRoleApplicationRoute({
  tableKey: 'dj',
  label: 'DJ',
  supabaseType: 'dj',
});
