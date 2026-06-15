'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationRow, ApplicationStatus, ApplicationType } from '@/types/database';
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_META,
  APPLICATION_TYPE_META,
  APPLICATION_TYPES,
} from '@/types/applications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';

export function ApplicationsTable({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<'' | ApplicationType>('');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () => applications.filter((a) => !removed.has(a.id) && (!typeFilter || a.type === typeFilter)),
    [applications, typeFilter, removed],
  );

  async function setStatus(id: string, status: ApplicationStatus) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  /**
   * Remove an application from the admin dashboard only (soft-delete via
   * admin_hidden_records). The application stays in Airtable — no Airtable
   * delete is ever called.
   */
  async function removeFromDashboard(a: ApplicationRow) {
    if (busyId) return;
    if (!confirm(`Remove ${a.name}'s application from the dashboard? It stays saved in Airtable and can be restored from Hidden.`)) {
      return;
    }
    setBusyId(a.id);
    try {
      const res = await fetch('/api/admin/hidden-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceTable: 'APPLICATIONS', sourceRecordId: a.id, reason: 'Removed from dashboard' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? 'Could not remove the application. Try again.');
        return;
      }
      setRemoved((prev) => new Set(prev).add(a.id));
      router.refresh();
    } catch {
      alert('Network error. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as '' | ApplicationType)} className="w-56">
          <option value="">All types</option>
          {APPLICATION_TYPES.map((t) => (
            <option key={t} value={t}>{APPLICATION_TYPE_META[t].label}</option>
          ))}
        </Select>
        <p className="mono-label">[ {filtered.length} of {applications.length} ]</p>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="border border-line bg-ink-800 p-6 text-sm text-muted">No applications.</p>
        )}
        {filtered.map((a) => {
          const meta = APPLICATION_STATUS_META[a.status];
          return (
            <div key={a.id} className="border border-line bg-ink-800 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className="border-line text-electric-400">{APPLICATION_TYPE_META[a.type].label}</Badge>
                    <Badge className={meta.className}>{meta.label}</Badge>
                  </div>
                  <h3 className="mt-2 font-display text-lg uppercase">{a.name}</h3>
                  <p className="text-sm text-muted">
                    {a.email}
                    {a.phone ? ` · ${a.phone}` : ''}
                    {a.instagram ? ` · ${a.instagram}` : ''}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <Select
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value as ApplicationStatus)}
                    className="w-44"
                    aria-label="Application status"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>{APPLICATION_STATUS_META[s].label}</option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    variant="hot"
                    disabled={busyId === a.id}
                    onClick={() => removeFromDashboard(a)}
                    title="Removes this application from the dashboard only — it stays in Airtable"
                  >
                    {busyId === a.id ? 'Removing…' : 'Remove from dashboard'}
                  </Button>
                </div>
              </div>
              {a.portfolio_url && (
                <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block break-all font-mono text-xs text-electric-400 hover:text-white">
                  {a.portfolio_url}
                </a>
              )}
              {a.experience && <p className="mt-3 whitespace-pre-line text-sm text-white/80"><span className="text-muted">Experience: </span>{a.experience}</p>}
              {a.message && <p className="mt-2 whitespace-pre-line text-sm text-white/80"><span className="text-muted">Message: </span>{a.message}</p>}
              <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
