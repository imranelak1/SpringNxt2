'use client';

import { useEffect, useState } from 'react';
import { getTasks, getProjectMembers } from '../../lib/api';
import type { AppRole, Project, Task, ProjectMember } from '../../lib/types';

interface ProjectWorkspaceProps {
  project: Project;
  token: string;
  role: AppRole;
  onBack: () => void;
  onEdit: () => void;
}

const statusColor: Record<string, string> = {
  TODO: 'var(--text-muted)',
  IN_PROGRESS: 'var(--accent2)',
  DONE: 'var(--accent)',
  BLOCKED: 'var(--accent3)',
};

const priorityColor: Record<string, string> = {
  LOW: 'var(--text-muted)',
  MEDIUM: 'var(--accent4)',
  HIGH: 'var(--accent2)',
  CRITICAL: 'var(--accent3)',
};

function formatDate(v: string | null) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(v));
}

function getStatusBadge(status: string) {
  if (status === 'ACTIVE') return 'b-green';
  if (status === 'COMPLETED') return 'b-blue';
  if (status === 'ON_HOLD') return 'b-yellow';
  return 'b-gray';
}

function normalizeGitHubRepo(repo: string | null | undefined) {
  if (!repo) return null;
  const trimmed = repo.trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\/+$/, '');
  return trimmed || null;
}

type Tab = 'tasks' | 'members';

export default function ProjectWorkspace({ project, token, role, onBack, onEdit }: ProjectWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setTasksLoading(true);
        return getTasks(token, undefined, undefined, project.id);
      })
      .then((r) => { if (active) setTasks(r.content); })
      .finally(() => { if (active) setTasksLoading(false); });
    return () => { active = false; };
  }, [token, project.id]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setMembersLoading(true);
        return getProjectMembers(token, project.id);
      })
      .then((r) => { if (active) setMembers(r); })
      .finally(() => { if (active) setMembersLoading(false); });
    return () => { active = false; };
  }, [token, project.id]);

  const done = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blocked = tasks.filter((t) => t.status === 'BLOCKED').length;
  const todo = tasks.filter((t) => t.status === 'TODO').length;

  const normalizedRepo = normalizeGitHubRepo(project.githubRepo);
  const filteredTasks = taskFilter === 'ALL' ? tasks : tasks.filter((t) => t.status === taskFilter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ marginTop: '2px', flexShrink: 0 }}
        >
          ← Projets
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(79,255,176,0.12)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{project.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </div>
            </div>
            <span className={`badge ${getStatusBadge(project.status)}`} style={{ marginLeft: '4px' }}>
              {project.status}
            </span>
          </div>
          {project.description && (
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginLeft: '54px', lineHeight: 1.5 }}>
              {project.description}
            </div>
          )}
        </div>
        {(role === 'admin' || role === 'pm') && (
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>
            Modifier
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div
        className="card"
        style={{ display: 'flex', gap: '0', marginBottom: '20px', overflow: 'hidden' }}
      >
        {[
          { label: 'Progression', value: `${project.progressPercentage ?? 0}%`, color: 'var(--accent)' },
          { label: 'Tâches', value: tasks.length, color: 'var(--accent2)' },
          { label: 'Membres', value: members.length, color: 'var(--accent4)' },
          { label: 'Budget', value: project.budget ? `${project.budget.toLocaleString()} MAD` : '—', color: 'var(--text-muted)' },
          {
            label: 'GitHub',
            value: normalizedRepo ? (
              <a
                href={`https://github.com/${normalizedRepo}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px' }}
                onClick={(e) => e.stopPropagation()}
              >
                {normalizedRepo}
              </a>
            ) : '—',
            color: 'var(--text-muted)',
          },
        ].map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRight: i < 4 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="pbar-wrap" style={{ marginBottom: '20px' }}>
        <div className="pbar" style={{ height: '8px', flex: 1 }}>
          <div className="pfill" style={{ width: `${project.progressPercentage ?? 0}%` }} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {done}/{tasks.length} tâches terminées
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {(['tasks', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {t === 'tasks' ? `Tâches (${tasks.length})` : `Membres (${members.length})`}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <div>
          {/* Task status mini-pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { label: 'Toutes', value: 'ALL', count: tasks.length },
              { label: 'À faire', value: 'TODO', count: todo },
              { label: 'En cours', value: 'IN_PROGRESS', count: inProgress },
              { label: 'Terminées', value: 'DONE', count: done },
              { label: 'Bloquées', value: 'BLOCKED', count: blocked },
            ].map((f) => (
              <span
                key={f.value}
                className={`tag ${taskFilter === f.value ? 'sel' : ''}`}
                onClick={() => setTaskFilter(f.value)}
                style={{ cursor: 'pointer' }}
              >
                {f.label} {f.count > 0 && <span style={{ opacity: 0.7, fontSize: '10px' }}>{f.count}</span>}
              </span>
            ))}
          </div>

          {tasksLoading ? (
            <div className="card"><div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chargement…</div></div>
          ) : filteredTasks.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Aucune tâche {taskFilter !== 'ALL' ? 'avec ce statut' : 'dans ce projet'}.
              </div>
            </div>
          ) : (
            <div className="card">
              {filteredTasks.map((task, i) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < filteredTasks.length - 1 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: statusColor[task.status] ?? 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    {task.assigneeEmail && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {task.assigneeEmail}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: priorityColor[task.priority] ?? 'var(--text-muted)', fontWeight: 600 }}>
                      {task.priority}
                    </span>
                    <span style={{ fontSize: '11px', color: statusColor[task.status] ?? 'var(--text-muted)' }}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.dueDate && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div>
          {membersLoading ? (
            <div className="card"><div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chargement…</div></div>
          ) : members.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Aucun membre dans ce projet.
              </div>
            </div>
          ) : (
            <div className="card">
              {members.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < members.length - 1 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(61,138,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--accent2)',
                      flexShrink: 0,
                    }}
                  >
                    {(m.firstName[0] + m.lastName[0]).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.firstName} {m.lastName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.userEmail}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge b-gray" style={{ fontSize: '10px' }}>{m.role}</span>
                    {m.allocationPercentage !== null && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.allocationPercentage}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
