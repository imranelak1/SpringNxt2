'use client';

import { useEffect, useState } from 'react';
import { getDashboard } from '../../lib/api';
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

  useEffect(() => {
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
    return <div className="card"><div className="card-body">Loading dashboard...</div></div>;
  }

  if (error) {
    return <div className="card"><div className="card-body">Dashboard error: {error}</div></div>;
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
          <div className="ai-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="ai-badge">API</span>
              <span className="ai-title">Live backend summary</span>
            </div>
            <div className="ai-insight">
              <span className="insight-ico">1.</span>
              <div className="insight-txt">
                <strong>{data.activeProjects}</strong> active projects are coming from
                <strong> /api/dashboard</strong>.
              </div>
            </div>
            <div className="ai-insight">
              <span className="insight-ico">2.</span>
              <div className="insight-txt">
                <strong>{data.completedTasks}</strong> of <strong>{data.totalTasks}</strong> tasks are
                completed.
              </div>
            </div>
            <div className="ai-insight">
              <span className="insight-ico">3.</span>
              <div className="insight-txt">
                Best current health score:{' '}
                <strong>
                  {Math.max(...data.projects.map((project) => project.overallHealthScore ?? 0), 0)}
                </strong>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  );
}
