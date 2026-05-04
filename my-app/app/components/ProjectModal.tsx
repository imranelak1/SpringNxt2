'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ProjectModalProps {
  onClose: () => void;
  onSave?: (project: ProjectData) => Promise<void> | void;
  initial?: Partial<ProjectData>;
  mode?: 'create' | 'edit';
}

export interface ProjectData {
  name: string;
  description: string;
  client: string;
  startDate: string;
  endDate: string;
  budget: string;
  spentAmount: string;
  status: string;
  priority: string;
  team: string[];
}

const defaultProject: ProjectData = {
  name: '',
  description: '',
  client: '',
  startDate: '',
  endDate: '',
  budget: '',
  spentAmount: '',
  status: 'active',
  priority: 'medium',
  team: [],
};

export default function ProjectModal({
  onClose,
  onSave,
  initial,
  mode = 'create',
}: ProjectModalProps) {
  const [form, setForm] = useState<ProjectData>({ ...defaultProject, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof ProjectData, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const healthScore = () => {
    if (!form.name) {
      return null;
    }

    const scores = [
      form.startDate && form.endDate ? 90 : 50,
      form.description.length > 20 ? 95 : 60,
      form.budget ? 85 : 40,
      form.priority === 'critical' ? 70 : 88,
    ];
    return Math.round(scores.reduce((left, right) => left + right) / scores.length);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await onSave?.(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save project.');
    } finally {
      setLoading(false);
    }
  };

  const hs = healthScore();
  const hsColor =
    hs === null
      ? 'var(--text-muted)'
      : hs >= 80
        ? 'var(--accent)'
        : hs >= 60
          ? 'var(--accent4)'
          : hs >= 40
            ? 'var(--accent3)'
            : '#ff3333';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{mode === 'create' ? 'New Project' : 'Edit Project'}</div>
          <div className="modal-close" onClick={onClose}>
            <X size={14} strokeWidth={2.5} />
          </div>
        </div>
        <div className="modal-body">
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Project name *</label>
              <input
                className="form-input"
                placeholder="Ex: Refonte Site Web"
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Client note</label>
              <input
                className="form-input"
                placeholder="Ex: TechCorp Maroc"
                value={form.client}
                onChange={(event) => set('client', event.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Describe the project scope..."
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
            />
          </div>
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start date *</label>
              <input
                className="form-input"
                type="date"
                value={form.startDate}
                onChange={(event) => set('startDate', event.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End date *</label>
              <input
                className="form-input"
                type="date"
                value={form.endDate}
                onChange={(event) => set('endDate', event.target.value)}
              />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Budget alloué</label>
              <input
                className="form-input"
                type="number"
                placeholder="120000"
                value={form.budget}
                onChange={(event) => set('budget', event.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Dépenses réelles</label>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                value={form.spentAmount}
                onChange={(event) => set('spentAmount', event.target.value)}
              />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(event) => set('status', event.target.value)}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">On Hold</option>
                <option value="done">Completed</option>
                <option value="archived">Cancelled</option>
              </select>
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
          </div>
          {hs !== null ? (
            <div
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Health preview</div>
              <div
                style={{
                  fontFamily: 'var(--font-syne,Syne),sans-serif',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: hsColor,
                }}
              >
                {hs}
              </div>
              <div className="pbar" style={{ flex: 1, height: '8px' }}>
                <div className="pfill" style={{ width: `${hs}%`, background: hsColor }}></div>
              </div>
            </div>
          ) : null}
          {error ? (
            <div
              style={{
                marginTop: '14px',
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
            {loading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
