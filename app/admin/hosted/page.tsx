import { getAdminHosted } from '@/lib/data/admin';
import { HostedManager } from '@/components/admin/hosted-manager';

export const dynamic = 'force-dynamic';

export default async function AdminHostedPage() {
  const hosted = await getAdminHosted();
  return (
    <div>
      <p className="mono-label">[ Who We&apos;ve Hosted ]</p>
      <h1 className="mb-6 mt-1 font-display text-4xl uppercase tracking-tight">Hosted Artists &amp; Brands</h1>
      <HostedManager initialHosted={hosted} />
    </div>
  );
}
