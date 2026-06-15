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
import { Select } from '@/components/ui/field';

export function ApplicationsTable({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<'' | ApplicationType>('');

  const filtered = useMemo(
    () => applications.filter((a) => !typeFilter || a.type === typeFilter),
    [applications, typeFilter],
  );

  async function setStatus(id: string, status: ApplicationStatus) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
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
