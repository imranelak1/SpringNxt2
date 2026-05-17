'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Edit3, Play, Plus, RotateCcw, Save, X } from 'lucide-react';
import {
  assignTaskToSprint,
  closeSprint,
  createCalendarEvent,
  createSprint,
  getScrumBoard,
  removeTaskFromSprint,
  startSprint,
  updateTask,
  updateTaskScrum,
} from '../../lib/api';
import type { AppRole, ProjectMember, ScrumBoard, SprintInput, Task, TaskScrumInput } from '../../lib/types';

interface ScrumViewProps {
  projectId: number;
  token: string;
  role: AppRole;
  members: ProjectMember[];
  onTasksChanged?: () => void;
}

const statuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;

const statusLabels: Record<string, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const statusColors: Record<string, string> = {
  TODO: 'var(--text-muted)',
  IN_PROGRESS: 'var(--accent2)',
  BLOCKED: 'var(--accent3)',
  DONE: 'var(--accent)',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function points(task: Task) {
  return task.storyPoints ?? 0;
}

function taskUpdatePayload(task: Task, overrides: Partial<{ status: string; assigneeId: number | null }> = {}) {
  return {
    title: task.title,
    description: task.description ?? '',
    status: overrides.status ?? task.status,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    storyPoints: task.storyPoints,
    backlogRank: task.backlogRank,
    acceptanceCriteria: task.acceptanceCriteria,
    projectId: task.projectId ?? 0,
    assigneeId: overrides.assigneeId !== undefined ? overrides.assigneeId : task.assigneeId,
    sprintId: task.sprintId,
  };
}

const iconButtonStyle = {
  width: '30px',
  height: '30px',
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
} as const;

export default function ScrumView({ projectId, token, role, members, onTasksChanged }: ScrumViewProps) {
  const canManage = role === 'admin' || role === 'pm';
  const [board, setBoard] = useState<ScrumBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPlanner, setShowPlanner] = useState(false);
  const [dailyTime, setDailyTime] = useState('09:30');
  const [draft, setDraft] = useState<SprintInput>({
    name: 'Sprint 1',
    goal: '',
    startDate: todayIso(),
    endDate: addDaysIso(13),
    capacityPoints: 20,
  });

  const refresh = async () => {
    setError('');
    const data = await getScrumBoard(token, projectId);
    setBoard(data);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    getScrumBoard(token, projectId)
      .then((data) => {
        if (!active) return;
        setBoard(data);
        setShowPlanner(!data.activeSprint && data.plannedSprints.length === 0);
      })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, projectId]);

  const run = async (action: () => Promise<unknown>, refreshTasks = false) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
      if (refreshTasks) onTasksChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const createSprintFromDraft = () =>
    run(async () => {
      await createSprint(token, projectId, draft);
      setShowPlanner(false);
    });

  const scheduleDailyScrum = () => {
    if (!board?.activeSprint) return;
    const dates = datesBetween(board.activeSprint.startDate, board.activeSprint.endDate)
      .filter((date) => {
        const day = new Date(`${date}T00:00:00`).getDay();
        return day !== 0 && day !== 6;
      });

    return run(async () => {
      await Promise.all(dates.map((eventDate) => createCalendarEvent(token, {
        title: `Daily Scrum - ${board.projectName}`,
        description: `${board.activeSprint!.name} | ${dailyTime} | Goal: ${board.activeSprint!.goal || 'Sprint sync'}`,
        eventDate,
        type: 'MEETING',
      })));
    });
  };

  const activeByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = Object.fromEntries(statuses.map((status) => [status, []]));
    for (const task of board?.activeSprintTasks ?? []) {
      grouped[task.status]?.push(task);
    }
    return grouped;
  }, [board]);

  if (loading) {
    return <div className="card"><div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading Scrum board...</div></div>;
  }

  if (!board) {
    return <div className="card"><div className="card-body" style={{ color: 'var(--accent3)', fontSize: '13px' }}>{error || 'Scrum board unavailable.'}</div></div>;
  }

  const active = board.activeSprint;

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      {error && (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,107,107,0.08)', color: 'var(--accent3)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>
                  {active ? active.name : 'No active sprint'}
                </div>
                <span className={`badge ${active ? 'b-green' : 'b-gray'}`} style={{ fontSize: '10px' }}>
                  {active ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {active
                  ? `${formatDate(active.startDate)} - ${formatDate(active.endDate)} | ${active.goal || 'No sprint goal'}`
                  : 'Create or start a sprint to move backlog work into delivery.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              {canManage && (
                <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setShowPlanner((value) => !value)}>
                  {showPlanner ? <X size={14} /> : <Plus size={14} />}
                  {showPlanner ? 'Cancel' : 'New sprint'}
                </button>
              )}
              {active && canManage && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    type="time"
                    value={dailyTime}
                    onChange={(e) => setDailyTime(e.target.value)}
                    title="Daily Scrum time"
                    style={{ width: '92px', height: '32px', fontSize: '12px' }}
                  />
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void scheduleDailyScrum()}>
                    Schedule daily
                  </button>
                </div>
              )}
              {active && canManage && (
                <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => void run(() => closeSprint(token, active.id), true)}>
                  <Check size={14} /> Close
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px' }}>
            <Metric label="Capacity" value={board.metrics.activeCapacityPoints} />
            <Metric label="Committed" value={board.metrics.activeCommittedPoints} />
            <Metric label="Done" value={board.metrics.activeCompletedPoints} />
            <Metric label="Remaining" value={board.metrics.activeRemainingPoints} />
            <Metric label="Blocked" value={board.metrics.activeBlockedItems} tone="danger" />
            <Metric label="Velocity" value={board.metrics.averageVelocity} />
          </div>

          {active && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Sprint progress</span>
                <span>{active.completedPoints}/{active.committedPoints} pts</span>
              </div>
              <div className="pbar" style={{ height: '7px' }}>
                <div
                  className="pfill"
                  style={{ width: `${active.committedPoints > 0 ? Math.min(100, (active.completedPoints / active.committedPoints) * 100) : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showPlanner && canManage && (
        <div className="card">
          <div className="card-body" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>Plan sprint</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Define goal, timebox, and capacity before pulling backlog items.
                </div>
              </div>
              <button className="btn btn-primary btn-sm" disabled={busy || !draft.name || !draft.startDate || !draft.endDate} onClick={() => void createSprintFromDraft()}>
                <Plus size={14} /> Create
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 0.9fr) minmax(280px, 1.5fr) minmax(154px, 154px) minmax(154px, 154px) minmax(112px, 112px)',
                gap: '12px',
                alignItems: 'end',
              }}
            >
              <CompactField label="Name">
                <input className="form-input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} style={{ height: '34px', width: '100%', minWidth: 0 }} />
              </CompactField>
              <CompactField label="Goal">
                <input className="form-input" value={draft.goal} onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))} style={{ height: '34px', width: '100%', minWidth: 0 }} />
              </CompactField>
              <CompactField label="Start">
                <input className="form-input" type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} style={{ height: '34px', width: '100%', minWidth: 0, paddingRight: '8px' }} />
              </CompactField>
              <CompactField label="End">
                <input className="form-input" type="date" value={draft.endDate} onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))} style={{ height: '34px', width: '100%', minWidth: 0, paddingRight: '8px' }} />
              </CompactField>
              <CompactField label="Capacity">
                <input className="form-input" type="number" min={0} value={draft.capacityPoints} onChange={(e) => setDraft((d) => ({ ...d, capacityPoints: Number(e.target.value) }))} style={{ height: '34px', width: '100%', minWidth: 0 }} />
              </CompactField>
            </div>
          </div>
        </div>
      )}

      {board.plannedSprints.length > 0 && (
        <div style={{ display: 'grid', gap: '8px' }}>
          {board.plannedSprints.map((sprint) => (
            <div key={sprint.id} className="card">
              <div className="card-body" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{sprint.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)} | cap {sprint.capacityPoints} pts | {sprint.taskCount} tasks
                  </div>
                </div>
                {canManage && (
                  <button className="btn btn-secondary btn-sm" disabled={busy || Boolean(active)} onClick={() => void run(() => startSprint(token, sprint.id))}>
                    <Play size={13} /> Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: '14px', alignItems: 'start' }}>
        <section className="card" style={{ maxHeight: '680px', overflow: 'hidden' }}>
          <div className="card-body" style={{ display: 'grid', gap: '8px', padding: '12px' }}>
            <SectionHeader title="Product backlog" meta={`${board.metrics.backlogItems} items | ${board.metrics.backlogPoints} pts`} />
            <div style={{ display: 'grid', gap: '8px', maxHeight: '610px', overflow: 'auto', paddingRight: '2px' }}>
              {board.backlog.length === 0 ? (
                <EmptyState text="Backlog is empty." />
              ) : (
                board.backlog.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canManage={canManage}
                    busy={busy}
                    actionLabel={active ? 'Pull in' : undefined}
                    members={members}
                    onAction={active ? () => run(() => assignTaskToSprint(token, active.id, task.id), true) : undefined}
                    onSaveScrum={(input) => run(() => updateTaskScrum(token, task.id, input), true)}
                    onAssigneeChange={(assigneeId) => run(() => updateTask(token, task.id, taskUpdatePayload(task, { assigneeId })), true)}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gap: '14px', minWidth: 0 }}>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
            {statuses.map((status) => (
              <SprintColumn
                key={status}
                status={status}
                tasks={activeByStatus[status]}
                canManage={canManage}
                busy={busy}
                members={members}
                onReturn={(task) => task.sprintId ? run(() => removeTaskFromSprint(token, task.sprintId!, task.id), true) : undefined}
                onSaveScrum={(task, input) => run(() => updateTaskScrum(token, task.id, input), true)}
                onStatusChange={(task, nextStatus) => run(() => updateTask(token, task.id, taskUpdatePayload(task, { status: nextStatus })), true)}
                onAssigneeChange={(task, assigneeId) => run(() => updateTask(token, task.id, taskUpdatePayload(task, { assigneeId })), true)}
              />
            ))}
          </section>

          <ScrumCharts board={board} />
        </div>
      </div>
    </div>
  );
}

function datesBetween(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', minWidth: 0 }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ marginTop: '3px', fontSize: '18px', fontWeight: 800, color: tone === 'danger' && value > 0 ? 'var(--accent3)' : 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function CompactField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', minWidth: 0 }}>
      {label}
      {children}
    </label>
  );
}

function MiniField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '3px', minWidth: 0 }}>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{meta}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 2px' }}>{text}</div>;
}

function SprintColumn({
  status,
  tasks,
  canManage,
  busy,
  members,
  onReturn,
  onSaveScrum,
  onStatusChange,
  onAssigneeChange,
}: {
  status: string;
  tasks: Task[];
  canManage: boolean;
  busy: boolean;
  members: ProjectMember[];
  onReturn: (task: Task) => Promise<void> | void;
  onSaveScrum: (task: Task, input: TaskScrumInput) => Promise<void> | void;
  onStatusChange: (task: Task, status: string) => Promise<void> | void;
  onAssigneeChange: (task: Task, assigneeId: number | null) => Promise<void> | void;
}) {
  const totalPoints = tasks.reduce((sum, task) => sum + points(task), 0);

  return (
    <div style={{ minHeight: '250px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', boxShadow: '0 8px 22px rgba(0,0,0,0.08)' }}>
      <SectionHeader title={statusLabels[status]} meta={`${totalPoints} pts`} />
      <div style={{ height: '2px', background: statusColors[status], opacity: 0.65, margin: '8px 0 10px', borderRadius: '999px' }} />
      <div style={{ display: 'grid', gap: '8px' }}>
        {tasks.length === 0 ? (
          <EmptyState text="No items" />
        ) : tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            compact
            canManage={canManage}
            busy={busy}
            members={members}
            actionLabel="Return"
            onAction={() => onReturn(task)}
            onSaveScrum={(input) => onSaveScrum(task, input)}
            onStatusChange={(nextStatus) => onStatusChange(task, nextStatus)}
            onAssigneeChange={(assigneeId) => onAssigneeChange(task, assigneeId)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  canManage,
  busy,
  members,
  compact = false,
  actionLabel,
  onAction,
  onSaveScrum,
  onStatusChange,
  onAssigneeChange,
}: {
  task: Task;
  canManage: boolean;
  busy: boolean;
  members: ProjectMember[];
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => Promise<void> | void;
  onSaveScrum: (input: TaskScrumInput) => Promise<void> | void;
  onStatusChange?: (status: string) => Promise<void> | void;
  onAssigneeChange?: (assigneeId: number | null) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [storyPoints, setStoryPoints] = useState(task.storyPoints ?? 0);
  const [rank, setRank] = useState(task.backlogRank ?? 0);
  const [assigneeId, setAssigneeId] = useState<number | ''>(task.assigneeId ?? '');

  useEffect(() => {
    setStoryPoints(task.storyPoints ?? 0);
    setRank(task.backlogRank ?? 0);
    setAssigneeId(task.assigneeId ?? '');
  }, [task.storyPoints, task.backlogRank, task.assigneeId]);

  const save = async () => {
    await onSaveScrum({ storyPoints, backlogRank: rank });
    if (onAssigneeChange) {
      await onAssigneeChange(assigneeId === '' ? null : assigneeId);
    }
    setEditing(false);
  };

  return (
    <article
      style={{
        padding: compact ? '10px' : '11px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        display: 'grid',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compact ? '12.5px' : '13px', fontWeight: 750, lineHeight: 1.35 }}>{task.title}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
            <span>{task.priority}</span>
            {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
            <span>{assigneeLabel(task, members)}</span>
          </div>
        </div>
        <span style={{ flexShrink: 0, borderRadius: '999px', padding: '3px 7px', background: 'rgba(13,90,188,0.1)', color: 'var(--accent)', fontSize: '11px', fontWeight: 800 }}>
          {points(task)} pts
        </span>
      </div>

      {editing && (
        <div style={{ display: 'grid', gap: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '58px 58px minmax(0, 1fr) 30px 30px', gap: '6px', alignItems: 'end' }}>
            <MiniField label="Pts">
              <input className="form-input" type="number" min={0} value={storyPoints} title="Story points" aria-label="Story points" onChange={(e) => setStoryPoints(Number(e.target.value))} style={{ height: '30px', fontSize: '12px', width: '100%', minWidth: 0 }} />
            </MiniField>
            <MiniField label="Rank">
              <input className="form-input" type="number" min={0} value={rank} title="Backlog rank" aria-label="Backlog rank" onChange={(e) => setRank(Number(e.target.value))} style={{ height: '30px', fontSize: '12px', width: '100%', minWidth: 0 }} />
            </MiniField>
            <MiniField label="Assignee">
              <select className="form-select" value={assigneeId} title="Assignee" aria-label="Assignee" onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')} style={{ height: '30px', fontSize: '12px', width: '100%', minWidth: 0 }}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </MiniField>
            <button className="btn btn-primary btn-sm" disabled={busy} title="Save" onClick={() => void save()} style={iconButtonStyle}>
              <Save size={13} />
            </button>
            <button className="btn btn-ghost btn-sm" disabled={busy} title="Cancel edit" onClick={() => setEditing(false)} style={iconButtonStyle}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {canManage && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!editing && (
            <button className="btn btn-ghost btn-sm" disabled={busy} title="Edit points, rank and assignee" onClick={() => setEditing(true)} style={iconButtonStyle}>
              <Edit3 size={13} />
            </button>
          )}
          {onStatusChange && (
            <StatusStepper currentStatus={task.status} disabled={busy} onChange={onStatusChange} />
          )}
          {onAction && actionLabel && (
            <button
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => void onAction()}
              title={actionLabel}
              style={{ ...iconButtonStyle, marginLeft: 'auto' }}
            >
              {actionLabel === 'Return' ? <RotateCcw size={13} /> : <Plus size={13} />}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function assigneeLabel(task: Task, members: ProjectMember[]) {
  const member = members.find((item) => item.userId === task.assigneeId);
  if (member) return `${member.firstName} ${member.lastName}`;
  return task.assigneeEmail ?? 'Unassigned';
}

function StatusStepper({
  currentStatus,
  disabled,
  onChange,
}: {
  currentStatus: string;
  disabled: boolean;
  onChange: (status: string) => Promise<void> | void;
}) {
  const currentIndex = statuses.findIndex((status) => status === currentStatus);
  const previous = currentIndex > 0 ? statuses[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', minWidth: 0, flex: 1 }}>
      {previous && (
        <button
          className="btn btn-ghost btn-sm"
          disabled={disabled}
          title={`Move to ${statusLabels[previous]}`}
          onClick={() => void onChange(previous)}
          style={iconButtonStyle}
        >
          ←
        </button>
      )}
      <span
        title={statusLabels[currentStatus]}
        style={{
          minWidth: 0,
          flex: 1,
          height: '28px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
          borderRadius: '8px',
          background: 'rgba(13,90,188,0.06)',
          border: '1px solid var(--border)',
          color: statusColors[currentStatus] ?? 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {statusLabels[currentStatus]}
      </span>
      {next && (
        <button
          className="btn btn-ghost btn-sm"
          disabled={disabled}
          title={`Move to ${statusLabels[next]}`}
          onClick={() => void onChange(next)}
          style={iconButtonStyle}
        >
          →
        </button>
      )}
    </div>
  );
}

function ScrumCharts({ board }: { board: ScrumBoard }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)', gap: '14px' }}>
      <BurndownChart board={board} />
      <VelocityChart board={board} />
    </div>
  );
}

function BurndownChart({ board }: { board: ScrumBoard }) {
  const max = Math.max(1, ...board.burndown.map((point) => Math.max(point.idealRemainingPoints, point.actualRemainingPoints ?? 0)));
  const width = 640;
  const height = 180;
  const pad = 24;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const xFor = (index: number) => pad + (board.burndown.length <= 1 ? 0 : (innerWidth * index) / (board.burndown.length - 1));
  const yFor = (value: number) => pad + innerHeight - (innerHeight * value) / max;
  const idealPoints = board.burndown.map((point, index) => `${xFor(index)},${yFor(point.idealRemainingPoints)}`).join(' ');
  const actualPoints = board.burndown
    .map((point, index) => point.actualRemainingPoints === null ? null : `${xFor(index)},${yFor(point.actualRemainingPoints)}`)
    .filter(Boolean)
    .join(' ');

  return (
    <div className="card">
      <div className="card-body" style={{ padding: '14px' }}>
        <SectionHeader title="Burndown" meta={board.burndown.length > 0 ? `${board.burndown.length} days` : 'No sprint'} />
        {board.burndown.length === 0 ? (
          <EmptyState text="Start a sprint to see burndown." />
        ) : (
          <div style={{ marginTop: '10px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180" role="img" aria-label="Sprint burndown chart">
              <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--border)" strokeWidth="1" />
              <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--border)" strokeWidth="1" />
              <polyline points={idealPoints} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="6 5" opacity="0.75" />
              {actualPoints && <polyline points={actualPoints} fill="none" stroke="var(--accent2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
              {board.burndown.map((point, index) => (
                point.actualRemainingPoints === null ? null : (
                  <circle key={point.date} cx={xFor(index)} cy={yFor(point.actualRemainingPoints)} r="3.2" fill="var(--accent2)">
                    <title>{`${point.date}: ${point.actualRemainingPoints} pts remaining`}</title>
                  </circle>
                )
              ))}
            </svg>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span><span style={{ display: 'inline-block', width: '18px', height: '3px', background: 'var(--accent2)', marginRight: '5px', verticalAlign: 'middle' }} />Actual</span>
              <span><span style={{ display: 'inline-block', width: '18px', borderTop: '2px dashed var(--text-muted)', marginRight: '5px', verticalAlign: 'middle' }} />Ideal</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VelocityChart({ board }: { board: ScrumBoard }) {
  const maxVelocity = Math.max(1, ...board.velocity.map((point) => Math.max(point.committedPoints, point.completedPoints)));

  return (
    <div className="card">
      <div className="card-body" style={{ padding: '14px' }}>
        <SectionHeader title="Velocity" meta={`${board.metrics.averageVelocity} avg pts`} />
        {board.velocity.length === 0 ? (
          <EmptyState text="No closed sprints yet." />
        ) : (
          <div style={{ display: 'grid', gap: '9px', marginTop: '12px' }}>
            {board.velocity.slice(-5).map((point) => (
              <div key={point.sprintId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.sprintName}</span>
                  <span>{point.completedPoints}/{point.committedPoints} pts</span>
                </div>
                <div className="pbar" style={{ height: '7px' }}>
                  <div className="pfill" style={{ width: `${(point.completedPoints / maxVelocity) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
