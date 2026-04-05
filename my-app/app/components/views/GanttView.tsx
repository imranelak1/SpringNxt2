'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProjects, getTasks } from '../../lib/api';
import type { Project, Task } from '../../lib/types';

interface GanttViewProps {
  token: string;
  role: 'admin' | 'pm' | 'employee';
}

function getProjectDates(project: Project) {
  const start = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
  const end = project.endDate ? new Date(project.endDate) : new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function getTaskDates(task: Task) {
  const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
  const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function diffInDays(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

function getTaskProgress(task: Task) {
  if (task.status === 'DONE') {
    return 100;
  }

  if (task.actualHours !== null && task.estimatedHours && task.estimatedHours > 0) {
    return Math.min(100, Math.round((task.actualHours / task.estimatedHours) * 100));
  }

  if (task.status === 'IN_PROGRESS') {
    return 55;
  }

  if (task.status === 'BLOCKED') {
    return 35;
  }

  return 0;
}

export default function GanttView({ token, role }: GanttViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [projectsResponse, tasksResponse] = await Promise.all([getProjects(token), getTasks(token)]);

        if (isMounted) {
          setProjects(projectsResponse.content);
          setTasks(tasksResponse.content);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load gantt data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (role === 'employee') {
      setLoading(false);
      return;
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [role, token]);

  const ganttData = useMemo(() => {
    if (projects.length === 0) {
      return null;
    }

    const datedProjects = projects.map((project) => ({
      ...project,
      ...getProjectDates(project),
    }));

    const datedTasks = tasks
      .filter((task) => task.projectId !== null)
      .map((task) => ({
        ...task,
        ...getTaskDates(task),
      }));

    const allStartTimes = [
      ...datedProjects.map((project) => project.start.getTime()),
      ...datedTasks.map((task) => task.start.getTime()),
    ];
    const allEndTimes = [
      ...datedProjects.map((project) => project.end.getTime()),
      ...datedTasks.map((task) => task.end.getTime()),
    ];

    const minDate = new Date(Math.min(...allStartTimes));
    const maxDate = new Date(Math.max(...allEndTimes));
    const totalDays = diffInDays(minDate, maxDate);

    return {
      minDate,
      maxDate,
      totalDays,
      projects: datedProjects.map((project) => ({
        ...project,
        offsetDays: diffInDays(minDate, project.start) - 1,
        durationDays: diffInDays(project.start, project.end),
        tasks: datedTasks
          .filter((task) => task.projectId === project.id)
          .map((task) => ({
            ...task,
            offsetDays: diffInDays(minDate, task.start) - 1,
            durationDays: diffInDays(task.start, task.end),
            progressPercentage: getTaskProgress(task),
          }))
          .sort((a, b) => a.start.getTime() - b.start.getTime()),
      })),
    };
  }, [projects, tasks]);

  if (role === 'employee') {
    return <div className="card"><div className="card-body">Gantt view is intended for manager and admin roles.</div></div>;
  }

  if (loading) {
    return <div className="card"><div className="card-body">Loading gantt view...</div></div>;
  }

  if (error) {
    return <div className="card"><div className="card-body">Gantt error: {error}</div></div>;
  }

  if (!ganttData) {
    return <div className="card"><div className="card-body">No project data available for gantt view.</div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>
            Project timeline
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {projects.length} projects and {tasks.length} tasks from backend dates
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0', overflowX: 'auto' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                minWidth: '220px',
                borderRight: '1px solid var(--border)',
                padding: '8px 14px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              PROJECT / TASK
            </div>
            <div
              style={{
                flex: 1,
                padding: '8px 14px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {ganttData.minDate.toLocaleDateString()} - {ganttData.maxDate.toLocaleDateString()}
            </div>
          </div>

          {ganttData.projects.map((project) => (
            <div key={project.id}>
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  minHeight: '56px',
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: '220px', borderRight: '1px solid var(--border)', padding: '10px 14px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 500, marginBottom: '3px' }}>{project.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {project.status} - {project.progressPercentage ?? 0}%
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative', height: '56px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(project.offsetDays / ganttData.totalDays) * 100}%`,
                      width: `${(project.durationDays / ganttData.totalDays) * 100}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(90deg,var(--accent2),var(--accent))',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${project.progressPercentage ?? 0}%`,
                        background: 'rgba(0,0,0,0.18)',
                      }}
                    ></div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(0,0,0,0.85)',
                        padding: '0 10px',
                        position: 'relative',
                        zIndex: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </span>
                  </div>
                </div>
              </div>

              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    minHeight: '44px',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                >
                  <div style={{ minWidth: '220px', borderRight: '1px solid var(--border)', padding: '8px 14px 8px 24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>{task.title}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {task.status} - {task.progressPercentage}%
                    </div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '44px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(task.offsetDays / ganttData.totalDays) * 100}%`,
                        width: `${(task.durationDays / ganttData.totalDays) * 100}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '20px',
                        borderRadius: '5px',
                        background: 'linear-gradient(90deg,var(--accent4),var(--accent2))',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${task.progressPercentage}%`,
                          background: 'rgba(0,0,0,0.16)',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

