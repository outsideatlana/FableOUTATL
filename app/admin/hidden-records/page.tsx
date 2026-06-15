import { getHiddenRecords } from '@/lib/data/admin';
import { HiddenRecordsManager } from '@/components/admin/hidden-records-manager';

export const dynamic = 'force-dynamic';

export default async function AdminHiddenRecordsPage() {
  const records = await getHiddenRecords();
  return (
    <div>
      <p className="mono-label">[ Hidden Records ]</p>
      <h1 className="mb-2 mt-1 font-display text-4xl uppercase tracking-tight">Hidden</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        RSVPs and applications removed from their dashboards. Restoring brings a record back to its
        tab. Originals are never deleted from Airtable.
      </p>
      <HiddenRecordsManager records={records} />
    </div>
  );
}
