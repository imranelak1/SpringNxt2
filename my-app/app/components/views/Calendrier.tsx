'use client';

import { useEffect, useMemo, useState } from 'react';
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents, getProjects, getTasks, updateCalendarEvent } from '../../lib/api';
import type { AppRole, CalendarEvent, CreateCalendarEventInput, Project, Task } from '../../lib/types';

interface CalendrierProps {
  token: string;
  role: AppRole;
}

interface CalendarTimelineEvent {
  id: string;
  customEventId?: number;
  title: string;
  date: Date;
  cls: '' | 'ev-green' | 'ev-yellow' | 'ev-red' | 'ev-purple';
  source: 'task' | 'project-start' | 'project-end' | 'custom';
}

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTaskEventClass(task: Task): CalendarTimelineEvent['cls'] {
  if (task.status === 'DONE') {
    return 'ev-green';
  }

  if (task.priority === 'CRITICAL' || task.status === 'BLOCKED') {
    return 'ev-red';
  }

  if (task.priority === 'HIGH') {
    return 'ev-yellow';
  }

  return '';
}

function getCustomEventClass(type: CalendarEvent['type']): CalendarTimelineEvent['cls'] {
  if (type === 'DEADLINE') {
    return 'ev-red';
  }

  if (type === 'MILESTONE') {
    return 'ev-green';
  }

  if (type === 'MEETING') {
    return 'ev-purple';
  }

  return '';
}

function formatRelativeBadge(targetDate: Date, now: Date) {
  const diffMs = startOfDay(targetDate).getTime() - startOfDay(now).getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return { text: 'Today', cls: 'b-blue' };
  }

  if (diffDays === 1) {
    return { text: 'Tomorrow', cls: 'b-yellow' };
  }

  if (diffDays > 1) {
    return { text: `In ${diffDays}d`, cls: 'b-gray' };
  }

  return { text: `Late ${Math.abs(diffDays)}d`, cls: 'b-red' };
}

function formatWeekLabel(date: Date) {
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  return `Week of ${date.getDate()} ${monthLabel}`;
}

export default function Calendrier({ token, role }: CalendrierProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [createError, setCreateError] = useState('');
  const [newEvent, setNewEvent] = useState<CreateCalendarEventInput>({
    title: '',
    description: '',
    eventDate: new Date().toISOString().slice(0, 10),
    type: 'CUSTOM',
  });
  const canManageEvents = role === 'admin' || role === 'pm';

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [taskResponse, projectResponse] = await Promise.all([
          getTasks(token),
          getProjects(token),
        ]);
        const calendarEventsResponse = await getCalendarEvents(token).catch(() => []);

        if (isMounted) {
          setTasks(taskResponse.content);
          setProjects(projectResponse.content);
          setCustomEvents(calendarEventsResponse);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load calendar data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [token, role]);

  const allEvents = useMemo<CalendarTimelineEvent[]>(() => {
    const taskEvents = tasks
      .map((task) => {
        const dueDate = parseDate(task.dueDate);
        if (!dueDate) {
          return null;
        }

        return {
          id: `task-${task.id}`,
          title: task.title,
          date: dueDate,
          cls: getTaskEventClass(task),
          source: 'task',
        } satisfies CalendarTimelineEvent;
      })
      .filter((event): event is CalendarTimelineEvent => event !== null);

    const projectEvents = projects.flatMap((project) => {
      const startDate = parseDate(project.startDate);
      const endDate = parseDate(project.endDate);

      const result: CalendarTimelineEvent[] = [];

      if (startDate) {
        result.push({
          id: `project-start-${project.id}`,
          title: `${project.name} start`,
          date: startDate,
          cls: 'ev-purple',
          source: 'project-start',
        });
      }

      if (endDate) {
        result.push({
          id: `project-end-${project.id}`,
          title: `${project.name} deadline`,
          date: endDate,
          cls: 'ev-green',
          source: 'project-end',
        });
      }

      return result;
    });

    const manualEvents = customEvents
      .map((event) => {
        const eventDate = parseDate(event.eventDate);
        if (!eventDate) {
          return null;
        }

        return {
          id: `custom-${event.id}`,
          customEventId: event.id,
          title: event.title,
          date: eventDate,
          cls: getCustomEventClass(event.type),
          source: 'custom',
        } satisfies CalendarTimelineEvent;
      })
      .filter((event): event is CalendarTimelineEvent => event !== null);

    return [...taskEvents, ...projectEvents, ...manualEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [customEvents, projects, tasks]);

  const monthModel = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyCount = mondayIndex(firstDay);

    const eventsByDay = new Map<number, CalendarTimelineEvent[]>();
    for (const event of allEvents) {
      if (event.date.getFullYear() !== year || event.date.getMonth() !== month) {
        continue;
      }

      const day = event.date.getDate();
      const current = eventsByDay.get(day) ?? [];
      current.push(event);
      eventsByDay.set(day, current);
    }

    const dayCells = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, month, day);
      const events = (eventsByDay.get(day) ?? []).slice(0, 3);
      const overflowCount = Math.max(0, (eventsByDay.get(day)?.length ?? 0) - 3);

      return {
        day,
        date,
        isToday: isSameDay(date, new Date()),
        events,
        overflowCount,
      };
    });

    const totalCells = leadingEmptyCount + daysInMonth;
    const trailingEmptyCount = (7 - (totalCells % 7)) % 7;

    return {
      leadingEmptyCount,
      trailingEmptyCount,
      dayCells,
      monthLabel: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth),
    };
  }, [allEvents, currentMonth]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return allEvents
      .filter((event) => isSameDay(event.date, selectedDate))
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [allEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return allEvents
      .filter((event) => startOfDay(event.date).getTime() >= startOfDay(now).getTime())
      .slice(0, 6);
  }, [allEvents]);

  const weeklyLoad = useMemo(() => {
    const now = new Date();
    const focusDate = isSameMonth(currentMonth, now) ? now : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const weekStart = new Date(focusDate);
    weekStart.setDate(focusDate.getDate() - mondayIndex(focusDate));
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 5 }, (_, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);

      const dayEvents = allEvents.filter((event) => isSameDay(event.date, dayDate));
      return {
        label: weekdayLabels[index],
        count: dayEvents.length,
        titles: dayEvents.slice(0, 2).map((event) => event.title),
      };
    });

    const maxCount = Math.max(1, ...weekDays.map((day) => day.count));
    const barPalette = [
      'rgba(79,255,176,0.3)',
      'rgba(61,138,255,0.25)',
      'rgba(167,139,250,0.2)',
      'rgba(255,203,71,0.2)',
      'rgba(255,107,107,0.2)',
    ];

    return {
      label: formatWeekLabel(weekStart),
      rows: weekDays.map((day, index) => ({
        ...day,
        width: day.count === 0 ? 8 : Math.max(12, Math.round((day.count / maxCount) * 100)),
        bg: barPalette[index % barPalette.length],
        summary: day.titles.length > 0 ? day.titles.join(' - ') : 'No events',
      })),
    };
  }, [allEvents, currentMonth]);

  if (loading) {
    return <div className="card"><div className="card-body">Loading calendar...</div></div>;
  }

  if (error) {
    return <div className="card"><div className="card-body">Calendar error: {error}</div></div>;
  }

  const resetModalState = () => {
    setShowCreateModal(false);
    setEditingEventId(null);
    setNewEvent({
      title: '',
      description: '',
      eventDate: new Date().toISOString().slice(0, 10),
      type: 'CUSTOM',
    });
    setCreateError('');
  };

  const handleSaveEvent = async () => {
    if (!canManageEvents || creatingEvent) {
      return;
    }

    if (!newEvent.title.trim()) {
      setCreateError('Event title is required.');
      return;
    }

    setCreatingEvent(true);
    setCreateError('');

    try {
      const payload = {
        ...newEvent,
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
      };

      if (editingEventId !== null) {
        const updated = await updateCalendarEvent(token, editingEventId, payload);
        setCustomEvents((current) => current.map((event) => (event.id === updated.id ? updated : event)));
      } else {
        const created = await createCalendarEvent(token, payload);
        setCustomEvents((current) => [...current, created]);
      }

      resetModalState();
    } catch (createEventError) {
      setCreateError(createEventError instanceof Error ? createEventError.message : 'Unable to save event.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const getSourceLabel = (source: CalendarTimelineEvent['source']) => {
    if (source === 'project-start') {
      return 'project start';
    }

    if (source === 'project-end') {
      return 'project deadline';
    }

    if (source === 'custom') {
      return 'manual event';
    }

    return 'task';
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!canManageEvents || deletingEventId !== null) {
      return;
    }

    setDeletingEventId(eventId);

    try {
      await deleteCalendarEvent(token, eventId);
      setCustomEvents((current) => current.filter((event) => event.id !== eventId));
    } catch (deleteError) {
      setCreateError(deleteError instanceof Error ? deleteError.message : 'Unable to delete event.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const openCreateModal = (date?: Date) => {
    const targetDate = date instanceof Date ? date : new Date();

    setEditingEventId(null);
    setCreateError('');
    setNewEvent({
      title: '',
      description: '',
      eventDate: targetDate.toISOString().slice(0, 10),
      type: 'CUSTOM',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (eventId: number) => {
    const selected = customEvents.find((event) => event.id === eventId);
    if (!selected) {
      return;
    }

    setEditingEventId(eventId);
    setCreateError('');
    setNewEvent({
      title: selected.title,
      description: selected.description ?? '',
      eventDate: selected.eventDate.slice(0, 10),
      type: selected.type,
    });
    setShowCreateModal(true);
  };

  return (
    <div>
      {showCreateModal ? (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && resetModalState()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingEventId !== null ? 'Edit Calendar Event' : 'Create Calendar Event'}</div>
              <div className="modal-close" onClick={() => resetModalState()}>x</div>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={newEvent.title}
                  onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Sprint review"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newEvent.eventDate}
                    onChange={(event) => setNewEvent((current) => ({ ...current, eventDate: event.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={newEvent.type}
                    onChange={(event) => setNewEvent((current) => ({ ...current, type: event.target.value as CreateCalendarEventInput['type'] }))}
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="MEETING">Meeting</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="MILESTONE">Milestone</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newEvent.description}
                  onChange={(event) => setNewEvent((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional context"
                />
              </div>
              {createError ? (
                <div style={{ color: 'var(--accent3)', fontSize: '12px' }}>{createError}</div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => resetModalState()}>Cancel</button>
              <button className="btn btn-primary" onClick={() => void handleSaveEvent()} disabled={creatingEvent}>
                {creatingEvent ? (editingEventId !== null ? 'Saving...' : 'Creating...') : (editingEventId !== null ? 'Save changes' : 'Create event')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
        >
          Prev
        </button>
        <div className="section-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          {monthModel.monthLabel}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        >
          Next
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
          Today
        </button>
        {canManageEvents ? (
          <button className="btn btn-primary btn-sm" onClick={() => openCreateModal()}>
            + Event
          </button>
        ) : null}
      </div>

      <div className="card mb18">
        <div style={{ padding: '16px 18px' }}>
          <div className="cal-grid mb10">
            {weekdayLabels.map((label) => (
              <div key={label} className="cal-day-lbl">{label}</div>
            ))}
          </div>

          <div className="cal-grid">
            {Array.from({ length: monthModel.leadingEmptyCount }, (_, index) => (
              <div key={`leading-${index}`} className="cal-day empty"></div>
            ))}

            {monthModel.dayCells.map((cell) => (
              <div
                key={cell.day}
                className={`cal-day${cell.isToday ? ' today' : ''}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <div className="cal-num">{cell.day}</div>
                {cell.events.map((event) => (
                  <div key={event.id} className={`cal-event ${event.cls}`.trim()}>{event.title}</div>
                ))}
                {cell.overflowCount > 0 ? (
                  <div className="cal-event">+{cell.overflowCount} more</div>
                ) : null}
              </div>
            ))}

            {Array.from({ length: monthModel.trailingEmptyCount }, (_, index) => (
              <div key={`trailing-${index}`} className="cal-day empty"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {selectedDate
                ? `Events on ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate)}`
                : 'Pick a day'}
            </div>
            {selectedDate && canManageEvents ? (
              <button className="btn btn-primary btn-sm" onClick={() => openCreateModal(selectedDate)}>
                + Event this day
              </button>
            ) : null}
          </div>
          {!selectedDate ? (
            <div className="card-body" style={{ color: 'var(--text-muted)' }}>
              Click on a calendar day to see details.
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="card-body" style={{ color: 'var(--text-muted)' }}>
              No events for this date.
            </div>
          ) : (
            selectedDayEvents.map((event) => (
              <div key={`selected-${event.id}`} className="tl-item">
                <div className="tl-dot" style={{ background: event.cls === 'ev-red' ? 'var(--accent3)' : event.cls === 'ev-yellow' ? 'var(--accent4)' : event.cls === 'ev-purple' ? 'var(--accent5)' : event.cls === 'ev-green' ? 'var(--accent)' : 'var(--accent2)' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="tl-title">{event.title}</div>
                  <div className="tl-sub">{getSourceLabel(event.source)}</div>
                </div>
                {canManageEvents && event.source === 'custom' && event.customEventId ? (
                  <button className="action-btn" onClick={() => openEditModal(event.customEventId)}>
                    Edit
                  </button>
                ) : null}
                {canManageEvents && event.source === 'custom' && event.customEventId ? (
                  <button
                    className="action-btn action-btn-danger"
                    onClick={() => void handleDeleteEvent(event.customEventId)}
                    disabled={deletingEventId === event.customEventId}
                  >
                    {deletingEventId === event.customEventId ? 'Deleting...' : 'Delete'}
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Upcoming events</div>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="card-body" style={{ color: 'var(--text-muted)' }}>
              No upcoming events.
            </div>
          ) : (
            upcomingEvents.map((event) => {
              const badge = formatRelativeBadge(event.date, new Date());
              const subtitle = `${new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).format(event.date)} - ${getSourceLabel(event.source)}`;

              return (
                <div key={`upcoming-${event.id}`} className="tl-item">
                  <div className="tl-dot" style={{ background: event.cls === 'ev-red' ? 'var(--accent3)' : event.cls === 'ev-yellow' ? 'var(--accent4)' : event.cls === 'ev-purple' ? 'var(--accent5)' : event.cls === 'ev-green' ? 'var(--accent)' : 'var(--accent2)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="tl-title">{event.title}</div>
                    <div className="tl-sub">{subtitle}</div>
                  </div>
                  {canManageEvents && event.source === 'custom' && event.customEventId ? (
                    <button
                      className="action-btn"
                      onClick={() => openEditModal(event.customEventId)}
                      disabled={deletingEventId === event.customEventId}
                    >
                      Edit
                    </button>
                  ) : null}
                  {canManageEvents && event.source === 'custom' && event.customEventId ? (
                    <button
                      className="action-btn action-btn-danger"
                      onClick={() => void handleDeleteEvent(event.customEventId)}
                      disabled={deletingEventId === event.customEventId}
                    >
                      {deletingEventId === event.customEventId ? 'Deleting...' : 'Delete'}
                    </button>
                  ) : null}
                  <span className={`badge ${badge.cls}`} style={{ fontSize: '10px' }}>{badge.text}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Weekly load</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{weeklyLoad.label}</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weeklyLoad.rows.map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', minWidth: '40px', color: 'var(--text-muted)' }}>{row.label}</span>
                  <div className="pbar" style={{ height: '22px', flex: 1, borderRadius: '6px' }}>
                    <div
                      className="pfill"
                      style={{
                        width: `${row.width}%`,
                        background: row.bg,
                        borderRadius: '6px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                      }}
                    >
                      <span style={{ fontSize: '11px' }}>{row.summary}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
