'use client';

import { useEffect, useRef, useState } from 'react';
import TaskDetailPanel from '../TaskDetailPanel';
import TaskModal, { type TaskData } from '../TaskModal';
import AiDecomposeModal from '../AiDecomposeModal';
import { useAlert } from '../AlertProvider';
import { createTask, deleteTask, getTasks, getUsers, getProjects, updateTask } from '../../lib/api';
import { SkeletonTable } from '../Skeleton';
import type { AppRole, Task, UserSummary, Project } from '../../lib/types';

interface TachesProps {
  token: string;
  role: AppRole;
}

type ViewMode = 'Kanban' | 'List';

const statusFilters = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Todo', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Done', value: 'DONE' },
];

const priorityFilters = [
  { label: 'All priorities', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

function getPriorityBadge(priority: string) {
  if (priority === 'CRITICAL') {
    return 'pri-critical';
  }

  if (priority === 'HIGH') {
    return 'pri-high';
  }

  if (priority === 'MEDIUM') {
    return 'pri-medium';
  }

  return 'pri-low';
}

function getStatusBadge(status: string) {
  if (status === 'DONE') {
    return 'b-green';
  }

  if (status === 'IN_PROGRESS') {
    return 'b-blue';
  }

  if (status === 'BLOCKED') {
    return 'b-red';
  }

  return 'b-gray';
}

function estimateProgress(task: Task) {
  if (task.status === 'DONE') {
    return 100;
  }

  if (task.actualHours !== null && task.estimatedHours && task.estimatedHours > 0) {
    return Math.min(100, Math.round((task.actualHours / task.estimatedHours) * 100));
  }

  if (task.status === 'IN_PROGRESS') {
    return 50;
  }

  if (task.status === 'BLOCKED') {
    return 35;
  }

  return 0;
}

function formatDueDate(value: string | null) {
  if (!value) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function getAssigneeInitials(email: string | null) {
  if (!email) {
    return '?';
  }

  return email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Taches({ token, role }: TachesProps) {
  const alerts = useAlert();
  const [viewMode, setViewMode] = useState<ViewMode>('Kanban');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDecomposeModal, setShowDecomposeModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const draggingTaskRef = useRef<Task | null>(null);
  const dragOverColRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      setLoading(true);
      setError('');

      try {
        const response = await getTasks(token, selectedStatus, selectedPriority);

        if (isMounted) {
          setTasks(response.content);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load tasks.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [selectedPriority, selectedStatus, token]);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [projectsResponse, usersResponse] = await Promise.all([getProjects(token), getUsers(token)]);

        if (isMounted) {
          setProjects(projectsResponse.content);
          setUsers(usersResponse);
        }
      } catch {
        if (isMounted) {
          setProjects([]);
          setUsers([]);
        }
      }
    }

    if (role !== 'employee') {
      void loadOptions();
    }

    return () => {
      isMounted = false;
    };
  }, [role, token]);

  const handleCreateTask = async (task: TaskData) => {
    const selectedProject = projects.find((project) => project.name === task.project);
    const selectedAssignee = users.find(
      (user) => `${user.firstName} ${user.lastName}` === task.assignee,
    );

    if (!selectedProject) {
      throw new Error('Please choose a valid project.');
    }

    const createdTask = await createTask(token, {
      title: task.title,
      description:
        task.tags.length > 0 ? `${task.description}\n\nTags: ${task.tags.join(', ')}` : task.description,
      status:
        task.status === 'inprogress'
          ? 'IN_PROGRESS'
          : task.status === 'blocked'
            ? 'BLOCKED'
            : task.status === 'done'
              ? 'DONE'
              : 'TODO',
      priority: task.priority.toUpperCase(),
      startDate: null,
      dueDate: task.dueDate || null,
      estimatedHours: null,
      actualHours: task.progress > 0 ? task.progress : null,
      projectId: selectedProject.id,
      assigneeId: selectedAssignee?.id ?? null,
    });

    setTasks((current) => [createdTask, ...current]);
    alerts.success('Tâche créée', `"${createdTask.title}" a été ajoutée au tableau.`);
  };

  const handleAddDecomposedTasks = async (titles: string[], projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const created = await Promise.all(
      titles.map((title) =>
        createTask(token, {
          title,
          description: '',
          status: 'TODO',
          priority: 'MEDIUM',
          startDate: null,
          dueDate: null,
          estimatedHours: null,
          actualHours: null,
          projectId,
          assigneeId: null,
        }),
      ),
    );
    setTasks((current) => [...created, ...current]);
  };

  const handleUpdateTask = async (taskData: TaskData) => {
    if (!editingTask) {
      return;
    }

    const selectedProject = projects.find((project) => project.name === taskData.project);
    const selectedAssignee = users.find(
      (user) => `${user.firstName} ${user.lastName}` === taskData.assignee,
    );

    if (!selectedProject) {
      throw new Error('Please choose a valid project.');
    }

    const updatedTask = await updateTask(token, editingTask.id, {
      title: taskData.title,
      description:
        taskData.tags.length > 0
          ? `${taskData.description}\n\nTags: ${taskData.tags.join(', ')}`
          : taskData.description,
      status:
        taskData.status === 'inprogress'
          ? 'IN_PROGRESS'
          : taskData.status === 'blocked'
            ? 'BLOCKED'
            : taskData.status === 'done'
              ? 'DONE'
              : 'TODO',
      priority: taskData.priority.toUpperCase(),
      startDate: editingTask.startDate,
      dueDate: taskData.dueDate || null,
      estimatedHours: editingTask.estimatedHours,
      actualHours: taskData.progress > 0 ? taskData.progress : null,
      projectId: selectedProject.id,
      assigneeId: selectedAssignee?.id ?? null,
    });

    setTasks((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    setEditingTask(null);
    alerts.success('Tâche mise à jour', `"${updatedTask.title}" a été modifiée.`);
  };

  const handleDeleteTask = async (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId);
    const confirmed = await alerts.confirm({
      title: 'Supprimer cette tâche ?',
      message: task ? `"${task.title}" sera supprimée définitivement.` : 'Cette action est définitive.',
      confirmText: 'Supprimer',
      tone: 'warning',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteTask(token, taskId);
      setTasks((current) => current.filter((item) => item.id !== taskId));
      setSelectedTask((current) => (current?.id === taskId ? null : current));
      alerts.success('Tâche supprimée', task ? `"${task.title}" a été retirée.` : undefined);
    } catch (deleteError) {
      alerts.error('Suppression impossible', deleteError instanceof Error ? deleteError.message : 'Réessayez dans un instant.');
    }
  };

  const handleSaveSelectedTaskProgress = async (progress: number) => {
    if (!selectedTask) {
      return;
    }

    const updatedTask = await updateTask(token, selectedTask.id, {
      title: selectedTask.title,
      description: selectedTask.description,
      status: selectedTask.status,
      priority: selectedTask.priority,
      startDate: selectedTask.startDate,
      dueDate: selectedTask.dueDate,
      estimatedHours: selectedTask.estimatedHours,
      actualHours: progress > 0 ? progress : null,
      projectId: selectedTask.projectId!,
      assigneeId: selectedTask.assigneeId,
    });

    setTasks((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    setSelectedTask(updatedTask);
    alerts.success('Progression sauvegardée', `Avancement mis à jour à ${progress}%.`);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    draggingTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
    // Defer the visual state change so React doesn't re-render and kill the drag source
    setTimeout(() => setDraggingId(task.id), 0);
  };

  const handleDragEnd = () => {
    draggingTaskRef.current = null;
    setDraggingId(null);
    setDragOverCol(null);
    dragOverColRef.current = null;
  };

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (dragOverColRef.current !== status) {
      dragOverColRef.current = status;
      setDragOverCol(status);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const task = draggingTaskRef.current;
    if (!task || task.status === newStatus) { handleDragEnd(); return; }

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    handleDragEnd();

    try {
      await updateTask(token, task.id, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        startDate: task.startDate,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        projectId: task.projectId!,
        assigneeId: task.assigneeId,
      });
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const groupedTasks = {
    TODO: tasks.filter((task) => task.status === 'TODO'),
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
    BLOCKED: tasks.filter((task) => task.status === 'BLOCKED'),
    DONE: tasks.filter((task) => task.status === 'DONE'),
  };

  if (loading) {
    return <SkeletonTable rows={6} cols={5} />;
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body" style={{ color: 'var(--accent3)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      {showDecomposeModal && (
        <AiDecomposeModal
          token={token}
          projects={projects}
          onClose={() => setShowDecomposeModal(false)}
          onAddTasks={handleAddDecomposedTasks}
        />
      )}
      {showTaskModal ? (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSave={handleCreateTask}
          projects={projects.map((project) => project.name)}
          members={users.map((user) => `${user.firstName} ${user.lastName}`)}
        />
      ) : null}
      {editingTask ? (
        <TaskModal
          mode="edit"
          initial={{
            title: editingTask.title,
            description: editingTask.description,
            project: editingTask.projectName ?? '',
            assignee:
              users.find((user) => user.id === editingTask.assigneeId)
                ? `${users.find((user) => user.id === editingTask.assigneeId)?.firstName ?? ''} ${users.find((user) => user.id === editingTask.assigneeId)?.lastName ?? ''}`.trim()
                : '',
            dueDate: editingTask.dueDate ?? '',
            priority: editingTask.priority.toLowerCase(),
            status:
              editingTask.status === 'IN_PROGRESS'
                ? 'inprogress'
                : editingTask.status === 'BLOCKED'
                  ? 'blocked'
                  : editingTask.status === 'DONE'
                    ? 'done'
                    : 'todo',
            progress: estimateProgress(editingTask),
            tags: [],
          }}
          onClose={() => setEditingTask(null)}
          onSave={handleUpdateTask}
          projects={projects.map((project) => project.name)}
          members={users.map((user) => `${user.firstName} ${user.lastName}`)}
        />
      ) : null}
      {selectedTask ? (
        <TaskDetailPanel
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            tag: selectedTask.projectName ?? 'Task',
            tagCls: 'tt-dev',
            status: selectedTask.status,
            priority: selectedTask.priority,
            assignee: selectedTask.assigneeEmail ?? 'Unassigned',
            assigneeInitials: getAssigneeInitials(selectedTask.assigneeEmail),
            dueDate: formatDueDate(selectedTask.dueDate),
            progress: estimateProgress(selectedTask),
            project: selectedTask.projectName ?? 'No project',
          }}
          token={token}
          onProgressSave={handleSaveSelectedTaskProgress}
          onClose={() => setSelectedTask(null)}
        />
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>
            Task delivery board
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {tasks.length} tasks loaded from the backend
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['Kanban', 'List'] as ViewMode[]).map((mode) => (
            <span
              key={mode}
              className={`tag ${viewMode === mode ? 'sel' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </span>
          ))}
        </div>

        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedPriority}
            onChange={(event) => setSelectedPriority(event.target.value)}
          >
            {priorityFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {role !== 'employee' ? (
          <>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowDecomposeModal(true)}
          title="Décomposer un objectif avec l'IA"
        >
          ✦ IA
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowTaskModal(true)}
        >
          New Task
        </button>
          </>
        ) : null}
      </div>

      {viewMode === 'Kanban' ? (
        <div className="kanban-grid">
          {Object.entries(groupedTasks).map(([status, columnTasks]) => {
            const isDragOver = dragOverCol === status;
            const colColor = status === 'DONE' ? 'var(--accent)' : status === 'IN_PROGRESS' ? 'var(--accent2)' : status === 'BLOCKED' ? 'var(--accent3)' : 'var(--text-muted)';
            return (
              <div
                key={status}
                className={`kb-col${isDragOver ? ' drag-over' : ''}`}
                onDragEnter={(e) => handleDragEnter(e, status)}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDragOverCol(null); dragOverColRef.current = null; } }}
                onDrop={(e) => void handleDrop(e, status)}
              >
                <div className="kb-header">
                  <div className="kb-dot" style={{ background: colColor }} />
                  <div className="kb-title">{status.replace('_', ' ')}</div>
                  <div className="kb-count">{columnTasks.length}</div>
                </div>

                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-card${draggingId === task.id ? ' dragging' : ''}`}
                    draggable={role !== 'employee'}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => draggingTaskRef.current === null && setSelectedTask(task)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span className="task-tag tt-dev">{task.projectName ?? 'Task'}</span>
                      <span className={`pri-badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                    </div>
                    <div className="task-title">{task.title}</div>
                    <div className="pbar-wrap" style={{ marginBottom: '8px' }}>
                      <div className="pbar">
                        <div className="pfill" style={{ width: `${estimateProgress(task)}%` }} />
                      </div>
                      <span className="ppct" style={{ fontSize: '10px' }}>{estimateProgress(task)}%</span>
                    </div>
                    <div className="task-footer">
                      <span className="task-due">{formatDueDate(task.dueDate)}</span>
                      <div className="av" style={{ width: '22px', height: '22px', fontSize: '9px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>
                        {getAssigneeInitials(task.assigneeEmail)}
                      </div>
                    </div>
                    {role !== 'employee' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}>Edit</button>
                        <button className="action-btn action-btn-danger" onClick={(e) => { e.stopPropagation(); void handleDeleteTask(task.id); }}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Drop placeholder shown when dragging over this column */}
                {isDragOver && draggingId !== null && (
                  <div className="kb-drop-placeholder">drop here</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Due</th>
                <th>Status</th>
                {role !== 'employee' ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} onClick={() => setSelectedTask(task)}>
                  <td style={{ fontSize: '13px', fontWeight: 500, maxWidth: '240px' }}>{task.title}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.projectName ?? 'No project'}</td>
                  <td style={{ fontSize: '12px' }}>{task.assigneeEmail ?? 'Unassigned'}</td>
                  <td>
                    <span className={`pri-badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                  </td>
                  <td>
                    <div className="pbar-wrap">
                      <div className="pbar" style={{ minWidth: '60px' }}>
                        <div className="pfill" style={{ width: `${estimateProgress(task)}%` }}></div>
                      </div>
                      <span className="ppct">{estimateProgress(task)}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{formatDueDate(task.dueDate)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(task.status)}`}>{task.status}</span>
                  </td>
                  {role !== 'employee' ? (
                    <td onClick={(event) => event.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="action-btn" onClick={() => setEditingTask(task)}>
                          Edit
                        </button>
                        <button
                          className="action-btn action-btn-danger"
                          onClick={() => void handleDeleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
