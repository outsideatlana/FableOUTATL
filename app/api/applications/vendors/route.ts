import { makeRoleApplicationRoute } from '@/lib/forms/application-route';

// POST /api/applications/vendors → Airtable Vendors (+ Supabase mirror).
export const POST = makeRoleApplicationRoute({
  tableKey: 'vendors',
  label: 'Vendor',
  supabaseType: 'vendor',
});
