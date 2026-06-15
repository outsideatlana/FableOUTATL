'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HiddenRecord } from '@/lib/data/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SOURCE_LABEL: Record<HiddenRecord['source_table'], string> = {
  RSVPS: 'RSVP',
  APPLICATIONS: 'Application',
};

/**
 * "Hidden Records" view. Lists RSVPs / applications currently removed from
 * the dashboard and lets an admin restore them. Restoring deletes the row in
 * admin_hidden_records via the server route — it never touches Airtable.
 */
export function HiddenRecordsManager({ records }: { records: HiddenRecord[] }) {
  const router = useRouter();
  const [restored, setRestored] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => records.filter((r) => !restored.has(r.id)), [records, restored]);

  async function restore(r: HiddenRecord) {
    if (busyId) return;
    setBusyId(r.id);
    try {
      const res = await fetch('/api/admin/hidden-records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceTable: r.source_table, sourceRecordId: r.source_record_id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? 'Could not restore the record. Try again.');
        return;
      }
      setRestored((prev) => new Set(prev).add(r.id));
      router.refresh();
    } catch {
      alert('Network error. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (visible.length === 0) {
    return (
      <p className="border border-line bg-ink-800 p-6 text-sm text-muted">
        Nothing is hidden. Removing an RSVP or application from its tab moves it here, where it can
        be restored. Originals always remain in Airtable.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="mono-label">[ {visible.length} hidden ]</p>
      {visible.map((r) => (
        <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 border border-line bg-ink-800 p-4">
          <div className="min-w-0">
            <Badge className="border-line text-electric-400">{SOURCE_LABEL[r.source_table]}</Badge>
            <h3 className="mt-2 truncate font-display text-lg uppercase">{r.label}</h3>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">
              Hidden {new Date(r.hidden_at).toLocaleString()}
              {r.hidden_by ? ` · by ${r.hidden_by}` : ''}
              {r.reason ? ` · ${r.reason}` : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === r.id}
            onClick={() => restore(r)}
          >
            {busyId === r.id ? 'Restoring…' : 'Restore to dashboard'}
          </Button>
        </div>
      ))}
    </div>
  );
}
