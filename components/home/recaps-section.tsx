import { RecapGallery } from '@/components/public/recap-gallery';
import type { getPublicRecaps } from '@/lib/data/public';

/**
 * Homepage "Past Recaps" section. Recaps are Supabase-backed (admin-managed);
 * the gallery handles its own empty state.
 */
export function RecapsSection({
  recaps,
}: {
  recaps: Awaited<ReturnType<typeof getPublicRecaps>>;
}) {
  return (
    <section id="recaps" className="relative gradient-divider px-6 py-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-red-600">[ 03 / Archive ]</p>
      <h2 className="mb-12 font-display text-5xl uppercase tracking-tighter md:text-7xl">Past Recaps</h2>
      <RecapGallery recaps={recaps} />
    </section>
  );
}
