import { getSession } from '@/lib/auth/admin';
import { AdminNav } from '@/components/admin/admin-nav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The login page renders without the admin chrome. All other admin
  // routes are guaranteed authenticated by middleware.ts.
  if (!session) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
