import {
  getAdminApplications,
  getHiddenAdminApplications,
} from '@/lib/data/admin';
import { ApplicationsTable } from '@/components/admin/applications-table';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const [applications, hiddenApplications] = await Promise.all([
    getAdminApplications(),
    getHiddenAdminApplications(),
  ]);
  return (
    <div>
      <p className="mono-label">[ Application Review ]</p>
      <h1 className="mb-6 mt-1 font-display text-4xl uppercase tracking-tight">Applications</h1>
      <ApplicationsTable
        applications={applications}
        hiddenApplications={hiddenApplications}
      />
    </div>
  );
}
