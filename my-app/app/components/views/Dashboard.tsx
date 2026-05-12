'use client';

import { useEffect, useState } from 'react';
import { getDashboard, getAiInsights } from '../../lib/api';
import { archiveAiGeneration, getAiArchive } from '../../lib/aiArchive';
import { SkeletonStatCards, SkeletonTable, SkeletonCard } from '../Skeleton';
import type { AppRole, DashboardResponse, View } from '../../lib/types';

interface DashboardProps {
  onNavigate: (view: View) => void;
  token: string;
  role: AppRole;
}

function getHealthColor(score: number | null) {
  if (score === null) {
    return 'var(--text-muted)';
  }

  if (score >= 80) {
    return 'var(--accent)';
  }

  if (score >= 60) {
    return 'var(--accent4)';
  }

  return 'var(--accent3)';
}

function getHealthLabel(score: number | null) {
  if (score === null) {
    return 'No score';
  }

  if (score >= 80) {
    return 'Healthy';
  }

  if (score >= 60) {
    return 'Watch';
  }

  return 'Risk';
}

function getRoleHeadline(role: AppRole) {
  if (role === 'admin') {
    return 'Platform overview';
  }

  if (role === 'employee') {
    return 'Your delivery overview';
  }

  return 'Project delivery overview';
}

export default function Dashboard({ onNavigate, token, role }: DashboardProps) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const [aiArchive, setAiArchive] = useState(() => getAiArchive());

  const loadInsights = () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiValidated(false);
    getAiInsights(token)
      .then((res) => { setAiInsights(res.insights); setAiLoaded(true); })
      .catch(() => { setAiInsights(['Erreur lors du chargement des insights IA.']); setAiLoaded(true); })
      .finally(() => setAiLoading(false));
  };

  const validateInsights = () => {
    archiveAiGeneration({
      type: 'dashboard-insights',
      title: 'Analyse NEXUS-IA',
      payload: { insights: aiInsights },
    });
    setAiArchive(getAiArchive());
    setAiValidated(true);
  };

  useEffect(() => {
    setAiArchive(getAiArchive());
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await getDashboard(token);

        if (isMounted) {
          setData(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div>
        <SkeletonStatCards />
        <div className="grid-lr">
          <SkeletonTable rows={4} cols={5} />
          <div className="col-stack">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body" style={{ color: 'var(--accent3)' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="card"><div className="card-body">No dashboard data yet.</div></div>;
  }

  const completionRate =
    data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card sc1">
          <div className="stat-lbl">{getRoleHeadline(role)}</div>
          <div className="stat-val">{data.totalProjects}</div>
          <div className="stat-chg up">Total projects tracked</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Active projects</div>
          <div className="stat-val">{data.activeProjects}</div>
          <div className="stat-chg up">Currently in delivery</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Completed tasks</div>
          <div className="stat-val">{data.completedTasks}</div>
          <div className="stat-chg up">{completionRate}% completion rate</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-lbl">Users in workspace</div>
          <div className="stat-val">{data.totalUsers}</div>
          <div className="stat-chg down">{data.totalTasks} tasks in total</div>
        </div>
      </div>

      <div className="grid-lr">
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Project health</div>
              <span className="card-action" onClick={() => onNavigate('projets')}>
                Open projects
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Tasks</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((project) => (
                  <tr key={project.projectId}>
                    <td style={{ fontSize: '13px', fontWeight: 500 }}>{project.projectName}</td>
                    <td>{project.status}</td>
                    <td>
                      <div className="pbar-wrap">
                        <div className="pbar">
                          <div
                            className="pfill"
                            style={{ width: `${project.progressPercentage ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="ppct">{project.progressPercentage ?? 0}%</span>
                      </div>
                    </td>
                    <td>
                      {project.completedTaskCount}/{project.taskCount}
                    </td>
                    <td
                      style={{
                        color: getHealthColor(project.overallHealthScore),
                        fontWeight: 600,
                      }}
                    >
                      {project.overallHealthScore ?? '--'} {getHealthLabel(project.overallHealthScore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-stack">
          <div className={`ai-card${aiLoading ? ' ai-scan-wrap' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className={`ai-badge${aiLoading ? ' ai-badge-pulse' : ''}`}>✦ IA</span>
              <span className="ai-title">Analyse NEXUS-IA</span>
              {!aiLoaded && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto', fontSize: '11px' }}
                  onClick={loadInsights}
                  disabled={aiLoading}
                >
                  {aiLoading ? '…' : 'Générer'}
                </button>
              )}
              {aiLoaded && (
                <span className={`badge ${aiValidated ? 'b-green' : 'b-yellow'}`} style={{ marginLeft: 'auto' }}>
                  {aiValidated ? 'Archivee' : 'A valider'}
                </span>
              )}
            </div>

            {!aiLoaded && !aiLoading && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Cliquez sur <strong>Générer</strong> pour obtenir une analyse IA en temps réel
                basée sur vos données de projets, budgets et équipe.
              </div>
            )}

            {aiLoading && (
              <div className="ai-thinking">
                <div className="ai-thinking-dots"><span /><span /><span /></div>
                <span className="ai-thinking-label">Analyse en cours…</span>
              </div>
            )}

            {aiLoaded && aiInsights.map((insight, i) => (
              <div
                key={i}
                className="ai-insight ai-insight-animated"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <span className="insight-ico">{['📊', '⚠', '💡', '🎯'][i] ?? '•'}</span>
                <div className="insight-txt">{insight}</div>
              </div>
            ))}

            {aiLoaded && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-ghost btn-sm" onClick={loadInsights} disabled={aiLoading}>
                  Regenerer
                </button>
                <button className="btn btn-primary btn-sm" onClick={validateInsights} disabled={aiValidated}>
                  {aiValidated ? 'Valide et archive' : 'Valider'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick actions</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-ghost" onClick={() => onNavigate('projets')}>
                View project list
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('taches')}>
                View task board
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('utilisateurs')}>
                Open users view
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Archives IA</div>
              <span className="badge b-gray">{aiArchive.length}</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiArchive.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aucune generation validee pour le moment.</div>
              ) : (
                aiArchive.slice(0, 5).map((item) => (
                  <div key={item.id} style={{ padding: '9px 10px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.type} - {new Date(item.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
