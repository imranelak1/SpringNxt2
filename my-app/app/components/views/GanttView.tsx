'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

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
            Project Timeline
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {projects.length} projects and {tasks.length} tasks
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ paddingTop: '0', overflowX: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10 }}>
            <div
              style={{
                minWidth: '280px',
                borderRight: '1px solid var(--border)',
                padding: '12px 14px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Task name
            </div>
            <div
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'flex',
                gap: '20px',
              }}
            >
              {Array.from({ length: Math.ceil(ganttData.totalDays / 7) }).map((_, i) => (
                <div key={i} style={{ minWidth: '80px', textAlign: 'center' }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {ganttData.projects.map((project) => {
            const groupKey = `project-${project.id}`;
            const isExpanded = expandedGroups[groupKey] !== false;

            return (
              <div key={project.id}>
                {/* Project group header */}
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    minHeight: '44px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      minWidth: '280px',
                      borderRight: '1px solid var(--border)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <ChevronDown
                      size={16}
                      style={{
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{project.name}</div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '44px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(project.offsetDays / ganttData.totalDays) * 100}%`,
                        width: `${(project.durationDays / ganttData.totalDays) * 100}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '24px',
                        borderRadius: '4px',
                        background: '#2dd4bf',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        overflow: 'hidden',
                      }}
                    >
                      {project.name}
                    </div>
                  </div>
                </div>

                {/* Task rows under project */}
                {isExpanded &&
                  project.tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        minHeight: '40px',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.008)',
                      }}
                    >
                      <div
                        style={{
                          minWidth: '280px',
                          borderRight: '1px solid rgba(255,255,255,0.03)',
                          padding: '8px 14px 8px 40px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: 'var(--text)',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ flex: 1, position: 'relative', height: '40px' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: `${(task.offsetDays / ganttData.totalDays) * 100}%`,
                            width: `${(task.durationDays / ganttData.totalDays) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: '20px',
                            borderRadius: '3px',
                            background: '#0ea5e9',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

