'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface TaskModalProps {
  onClose: () => void;
  onSave?: (task: TaskData) => Promise<void> | void;
  initial?: Partial<TaskData>;
  mode?: 'create' | 'edit';
  members?: string[];
  projects?: string[];
}

export interface TaskData {
  title: string;
  description: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: string;
  status: string;
  progress: number;
  tags: string[];
}

const defaultTask: TaskData = {
  title: '',
  description: '',
  project: '',
  assignee: '',
  dueDate: '',
  priority: 'medium',
  status: 'todo',
  progress: 0,
  tags: [],
};

export default function TaskModal({
  onClose,
  onSave,
  initial,
  mode = 'create',
  members = [],
  projects = [],
}: TaskModalProps) {
  const [form, setForm] = useState<TaskData>({
    ...defaultTask,
    project: projects[0] ?? '',
    ...initial,
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof TaskData>(field: K, value: TaskData[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const addTag = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      set('tags', [...form.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => set('tags', form.tags.filter((_, currentIndex) => currentIndex !== index));

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await onSave?.(form);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save task.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{mode === 'create' ? 'New Task' : 'Edit Task'}</div>
          <div className="modal-close" onClick={onClose}>
            <X size={14} strokeWidth={2.5} />
          </div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Task title *</label>
            <input
              className="form-input"
              placeholder="Ex: Integrate Stripe payment API"
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Describe the task..."
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
            />
          </div>
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Project *</label>
              <select className="form-select" value={form.project} onChange={(event) => set('project', event.target.value)}>
                <option value="">Choose a project</option>
                {projects.map((project) => (
                  <option key={project}>{project}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assignee} onChange={(event) => set('assignee', event.target.value)}>
                <option value="">No assignee</option>
                {members.map((member) => (
                  <option key={member}>{member}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row-3" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due date *</label>
              <input
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={(event) => set('dueDate', event.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(event) => set('priority', event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(event) => set('status', event.target.value)}>
                <option value="todo">Todo</option>
                <option value="inprogress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Progress - {form.progress}%</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                className="progress-slider"
                min={0}
                max={100}
                value={form.progress}
                onChange={(event) => set('progress', parseInt(event.target.value, 10))}
                style={{ flex: 1 }}
              />
              <div className="pbar" style={{ width: '80px', height: '8px' }}>
                <div className="pfill" style={{ width: `${form.progress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tag-input-wrap">
              {form.tags.map((tag, index) => (
                <span key={index} className="tag-chip">
                  {tag}
                  <span className="tag-chip-remove" onClick={() => removeTag(index)}>
                    x
                  </span>
                </span>
              ))}
              <input
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: '12px',
                  minWidth: '80px',
                }}
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>
          {error ? (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--accent3)',
                background: 'rgba(255,107,107,0.08)',
                padding: '10px 12px',
                borderRadius: '8px',
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => void handleSave()} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
