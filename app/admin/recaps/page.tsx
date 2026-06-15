import { getAdminRecaps, getAdminEventOptions } from '@/lib/data/admin';
import { RecapManager } from '@/components/admin/recap-manager';

export const dynamic = 'force-dynamic';

export default async function AdminRecapsPage() {
  const [recaps, eventOptions] = await Promise.all([
    getAdminRecaps(),
    getAdminEventOptions(),
  ]);
  return (
    <div>
      <p className="mono-label">[ Recap Management ]</p>
      <h1 className="mb-6 mt-1 font-display text-4xl uppercase tracking-tight">Recap Photos</h1>
      <RecapManager initialRecaps={recaps} eventOptions={eventOptions} />
    </div>
  );
}
