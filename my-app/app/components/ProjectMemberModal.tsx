'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export interface ProjectMemberFormData {
  projectId: string;
  userId: string;
  role: string;
  allocationPercentage: string;
}

interface ProjectMemberModalProps {
  onClose: () => void;
  onSave?: (data: ProjectMemberFormData) => Promise<void> | void;
  mode?: 'create' | 'edit';
  initial?: Partial<ProjectMemberFormData>;
  projects: { id: number; name: string }[];
  users: { id: number; name: string; email: string }[];
}

export default function ProjectMemberModal({
  onClose,
  onSave,
  mode = 'create',
  initial,
  projects,
  users,
}: ProjectMemberModalProps) {
  const [form, setForm] = useState<ProjectMemberFormData>({
    projectId: initial?.projectId ?? '',
    userId: initial?.userId ?? '',
    role: initial?.role ?? 'CONTRIBUTOR',
    allocationPercentage: initial?.allocationPercentage ?? '50',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof ProjectMemberFormData, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await onSave?.(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save assignment.');
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {mode === 'create' ? 'Assign Project Member' : 'Edit Assignment'}
          </div>
          <div className="modal-close" onClick={onClose}>
            <X size={14} strokeWidth={2.5} />
          </div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select className="form-select" value={form.projectId} onChange={(event) => set('projectId', event.target.value)}>
              <option value="">Choose project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">User *</label>
            <select className="form-select" value={form.userId} onChange={(event) => set('userId', event.target.value)}>
              <option value="">Choose user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={(event) => set('role', event.target.value)}>
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="CONTRIBUTOR">Contributor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Allocation %</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={100}
                value={form.allocationPercentage}
                onChange={(event) => set('allocationPercentage', event.target.value)}
              />
            </div>
          </div>
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
            {loading ? 'Saving...' : mode === 'create' ? 'Assign Member' : 'Save Assignment'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
