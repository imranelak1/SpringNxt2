'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface UserModalProps {
  onClose: () => void;
  onSave?: (user: UserFormData) => Promise<void> | void;
  mode?: 'create' | 'edit';
  initial?: { name: string; email: string; role: string };
}

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  password: string;
}

export default function UserModal({ onClose, onSave, mode = 'create', initial }: UserModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [role, setRole] = useState(initial?.role || 'employee');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await onSave?.({ name, email, role, password });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save user.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{mode === 'create' ? 'Invite User' : 'Edit User'}</div>
          <div className="modal-close" onClick={onClose}>
            <X size={14} strokeWidth={2.5} />
          </div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full name *</label>
            <input
              className="form-input"
              placeholder="Ex: Hassan Benjelloun"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              placeholder="hassan@nexus.ma"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="admin">Administrator</option>
              <option value="pm">Project Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{mode === 'create' ? 'Temporary password' : 'New password'}</label>
            <input
              className="form-input"
              type="password"
              placeholder={mode === 'create' ? 'password123' : 'Leave empty to keep current password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
              {mode === 'create'
                ? 'Leave empty to use the default backend password.'
                : 'Optional when editing an existing user.'}
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
            {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save User'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
