'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Circle, Play, RefreshCw } from 'lucide-react';
import { getProjects, getScrumBoard, updateTask } from '../../lib/api';
import type { ScrumBoard, Task } from '../../lib/types';

interface MySprintViewProps {
  token: string;
}

const statusOptions = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
];

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function points(task: Task) {
  return task.storyPoints ?? 0;
}

function taskPayload(task: Task, status: string) {
  return {
    title: task.title,
    description: task.description ?? '',
    status,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    storyPoints: task.storyPoints,
    backlogRank: task.backlogRank,
    acceptanceCriteria: task.acceptanceCriteria,
    projectId: task.projectId ?? 0,
    assigneeId: task.assigneeId,
    sprintId: task.sprintId,
  };
}

export default function MySprintView({ token }: MySprintViewProps) {
  const [boards, setBoards] = useState<ScrumBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSprintBoards() {
      setLoading(true);
      setError('');

      try {
        const projectResponse = await getProjects(token, undefined, undefined, 100);
        const loadedBoards = await Promise.all(
          projectResponse.content.map((project) =>
            getScrumBoard(token, project.id).catch(() => null),
          ),
        );

        if (!active) return;
        setBoards(loadedBoards.filter((board): board is ScrumBoard => board !== null));
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load sprint data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSprintBoards();

    return () => {
      active = false;
    };
  }, [refreshKey, token]);

  const activeBoards = useMemo(
    () => boards.filter((board) => board.activeSprint || board.activeSprintTasks.length > 0 || board.backlog.length > 0),
    [boards],
  );

  const totals = useMemo(() => {
    const activeTasks = activeBoards.flatMap((board) => board.activeSprintTasks);
    return {
      projects: activeBoards.length,
      activeTasks: activeTasks.length,
      donePoints: activeTasks
        .filter((task) => task.status === 'DONE')
        .reduce((sum, task) => sum + points(task), 0),
      remainingPoints: activeTasks
        .filter((task) => task.status !== 'DONE')
        .reduce((sum, task) => sum + points(task), 0),
      blocked: activeTasks.filter((task) => task.status === 'BLOCKED').length,
    };
  }, [activeBoards]);

  const updateStatus = async (task: Task, status: string) => {
    if (task.status === status || busyTaskId !== null) return;

    setBusyTaskId(task.id);
    setError('');

    try {
      await updateTask(token, task.id, taskPayload(task, status));
      setRefreshKey((value) => value + 1);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update task status.');
    } finally {
      setBusyTaskId(null);
    }
  };

  if (loading) {
    return <div className="card"><div className="card-body">Loading your sprint...</div></div>;
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Mon sprint</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Sprint actif, backlog personnel et avancement de vos taches assignees.
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error ? (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,107,107,0.08)', color: 'var(--accent3)', fontSize: '12px' }}>
          {error}
        </div>
      ) : null}

      <div className="stats-row">
        <div className="stat-card sc1">
          <div className="stat-lbl">Projects in sprint</div>
          <div className="stat-val">{totals.projects}</div>
          <div className="stat-chg up">Visible Scrum boards</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Sprint tasks</div>
          <div className="stat-val">{totals.activeTasks}</div>
          <div className="stat-chg up">Assigned to you</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Done points</div>
          <div className="stat-val">{totals.donePoints}</div>
          <div className="stat-chg up">Delivered this sprint</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-lbl">Remaining</div>
          <div className="stat-val">{totals.remainingPoints}</div>
          <div className="stat-chg down">{totals.blocked} blocked item(s)</div>
        </div>
      </div>

      {activeBoards.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ color: 'var(--text-muted)' }}>
            Aucun sprint ou backlog Scrum ne vous est assigne pour le moment.
          </div>
        </div>
      ) : (
        activeBoards.map((board) => (
          <SprintProjectCard
            key={board.projectId}
            board={board}
            busyTaskId={busyTaskId}
            onStatusChange={updateStatus}
          />
        ))
      )}
    </div>
  );
}

function SprintProjectCard({
  board,
  busyTaskId,
  onStatusChange,
}: {
  board: ScrumBoard;
  busyTaskId: number | null;
  onStatusChange: (task: Task, status: string) => Promise<void>;
}) {
  const active = board.activeSprint;
  const sprintTasks = board.activeSprintTasks;
  const backlogTasks = board.backlog;
  const committed = board.metrics.activeCommittedPoints;
  const done = board.metrics.activeCompletedPoints;
  const progress = committed > 0 ? Math.round((done / committed) * 100) : 0;

  return (
    <section className="card">
      <div className="card-body" style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>{board.projectName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {active
                ? `${active.name} | ${formatDate(active.startDate)} - ${formatDate(active.endDate)}`
                : 'No active sprint'}
            </div>
            {active?.goal ? (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.5 }}>
                Goal: {active.goal}
              </div>
            ) : null}
          </div>
          <span className={`badge ${active ? 'b-green' : 'b-gray'}`}>
            {active ? 'ACTIVE' : 'BACKLOG'}
          </span>
        </div>

        {active ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Your sprint progress</span>
              <span>{done}/{committed} pts</span>
            </div>
            <div className="pbar" style={{ height: '8px' }}>
              <div className="pfill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)', gap: '14px', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <SectionHeader title="Sprint tasks" meta={`${sprintTasks.length} items`} />
            {sprintTasks.length === 0 ? (
              <EmptyState text="No assigned task in the active sprint." />
            ) : (
              sprintTasks.map((task) => (
                <EmployeeSprintTask
                  key={task.id}
                  task={task}
                  busy={busyTaskId === task.id}
                  onStatusChange={onStatusChange}
                />
              ))
            )}
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <SectionHeader title="Personal backlog" meta={`${backlogTasks.length} items`} />
            {backlogTasks.length === 0 ? (
              <EmptyState text="No personal backlog items for this project." />
            ) : (
              backlogTasks.map((task) => (
                <div key={task.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                    {task.priority} | {points(task)} pts | waiting for sprint pull
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmployeeSprintTask({
  task,
  busy,
  onStatusChange,
}: {
  task: Task;
  busy: boolean;
  onStatusChange: (task: Task, status: string) => Promise<void>;
}) {
  return (
    <article style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'grid', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ marginTop: '2px', color: task.status === 'DONE' ? 'var(--accent)' : 'var(--text-muted)' }}>
          {task.status === 'DONE' ? <Check size={15} /> : task.status === 'IN_PROGRESS' ? <Play size={15} /> : <Circle size={15} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 750 }}>{task.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {task.priority} | {points(task)} pts{task.dueDate ? ` | Due ${formatDate(task.dueDate)}` : ''}
          </div>
        </div>
        <span className={`badge ${task.status === 'DONE' ? 'b-green' : task.status === 'BLOCKED' ? 'b-red' : task.status === 'IN_PROGRESS' ? 'b-blue' : 'b-gray'}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {statusOptions.map((status) => (
          <button
            key={status.value}
            className={`btn btn-sm ${task.status === status.value ? 'btn-primary' : 'btn-ghost'}`}
            disabled={busy || task.status === status.value}
            onClick={() => void onStatusChange(task, status.value)}
          >
            {status.label}
          </button>
        ))}
      </div>
    </article>
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
  return (
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      {text}
    </div>
  );
}
