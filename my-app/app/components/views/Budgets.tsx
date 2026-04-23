'use client';

import { useEffect, useState } from 'react';
import { getProjects } from '../../lib/api';
import { SkeletonTable } from '../Skeleton';
import type { Project } from '../../lib/types';

interface BudgetsProps {
  token: string;
}

function statusBadge(status: string) {
  if (status === 'ACTIVE') return 'b-blue';
  if (status === 'DONE' || status === 'COMPLETED') return 'b-green';
  if (status === 'PAUSED' || status === 'ON_HOLD') return 'b-gray';
  if (status === 'ARCHIVED' || status === 'CANCELLED') return 'b-red';
  return 'b-yellow';
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA').format(Math.round(n));
}

export default function Budgets({ token }: BudgetsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await getProjects(token, undefined, undefined);
        if (isMounted) setProjects(res.content);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Unable to load projects.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [token]);

  if (loading) return <SkeletonTable rows={5} cols={5} />;

  if (error) {
    return (
      <div className="card">
        <div className="card-body" style={{ color: 'var(--accent3)' }}>{error}</div>
      </div>
    );
  }

  const withBudget = projects.filter((p) => p.budget != null && p.budget > 0);
  const totalBudget = withBudget.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const totalConsumed = withBudget.reduce((sum, p) => {
    const progress = p.progressPercentage ?? 0;
    return sum + (p.budget ?? 0) * (progress / 100);
  }, 0);
  const totalRemaining = totalBudget - totalConsumed;
  const overBudgetCount = withBudget.filter((p) => (p.progressPercentage ?? 0) > 100).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Budget tracking</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {withBudget.length} project{withBudget.length !== 1 ? 's' : ''} with allocated budget
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card sc1">
          <div className="stat-lbl">Total budget</div>
          <div className="stat-val">{totalBudget >= 1000 ? `${fmt(totalBudget / 1000)}k` : fmt(totalBudget)}</div>
          <div className="stat-chg">MAD allocated</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Consumed (est.)</div>
          <div className="stat-val">{totalBudget > 0 ? `${Math.round((totalConsumed / totalBudget) * 100)}%` : '—'}</div>
          <div className="stat-chg down">Based on progress</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Remaining (est.)</div>
          <div className="stat-val">{totalRemaining >= 1000 ? `${fmt(totalRemaining / 1000)}k` : fmt(totalRemaining)}</div>
          <div className="stat-chg up">MAD available</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-lbl">Projects</div>
          <div className="stat-val">{projects.length}</div>
          <div className="stat-chg">{overBudgetCount > 0 ? `${overBudgetCount} over budget` : 'All on track'}</div>
        </div>
      </div>

      {withBudget.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            No projects have a budget set. Add a budget when creating or editing a project.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Budget by project</div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Allocated</th>
                <th>Consumed (est.)</th>
                <th>Remaining (est.)</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {withBudget.map((p) => {
                const budget = p.budget ?? 0;
                const pct = Math.min(100, p.progressPercentage ?? 0);
                const consumed = budget * (pct / 100);
                const remaining = budget - consumed;
                const isOver = pct >= 100;

                return (
                  <tr key={p.id}>
                    <td style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</td>
                    <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>{fmt(budget)} MAD</td>
                    <td>
                      <div className="pbar-wrap">
                        <div className="pbar">
                          <div
                            className="pfill"
                            style={{ width: `${pct}%`, background: isOver ? 'var(--accent3)' : undefined }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '12px', minWidth: '80px', color: isOver ? 'var(--accent3)' : undefined }}>
                          {fmt(consumed)} MAD
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: isOver ? 'var(--accent3)' : 'var(--accent)' }}>
                      {remaining >= 0 ? `${fmt(remaining)} MAD` : `−${fmt(Math.abs(remaining))} MAD`}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {projects.filter((p) => !p.budget || p.budget === 0).length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {projects.filter((p) => !p.budget || p.budget === 0).length} project(s) have no budget set and are not shown above.
        </div>
      )}
    </div>
  );
}
