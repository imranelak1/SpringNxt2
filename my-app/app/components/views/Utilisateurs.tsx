'use client';

import { useEffect, useMemo, useState } from 'react';
import UserModal, { type UserFormData } from '../UserModal';
import { createUser, deleteUser, getUsers, updateUser } from '../../lib/api';
import type { UserSummary } from '../../lib/types';

interface UtilisateursProps {
  token: string;
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Project Manager',
  EMPLOYEE: 'Employee',
};

const roleBadge: Record<string, string> = {
  ADMIN: 'b-red',
  MANAGER: 'b-purple',
  EMPLOYEE: 'b-blue',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

export default function Utilisateurs({ token }: UtilisateursProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setLoading(true);
      setError('');

      try {
        const response = await getUsers(token);

        if (isMounted) {
          setUsers(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        const matchesSearch =
          search.trim() === '' ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase());

        return matchesRole && matchesSearch;
      }),
    [filterRole, search, users],
  );

  const handleCreateUser = async (user: UserFormData) => {
    const [firstName = '', ...rest] = user.name.trim().split(' ');
    const lastName = rest.join(' ').trim();

    if (!firstName || !lastName) {
      throw new Error('Please enter first and last name.');
    }

    const createdUser = await createUser(token, {
      firstName,
      lastName,
      email: user.email,
      password: user.password,
      role: user.role === 'admin' ? 'ADMIN' : user.role === 'pm' ? 'MANAGER' : 'EMPLOYEE',
    });

    setUsers((current) => [createdUser, ...current]);
  };

  const handleUpdateUser = async (user: UserFormData) => {
    if (!editingUser) {
      return;
    }

    const [firstName = '', ...rest] = user.name.trim().split(' ');
    const lastName = rest.join(' ').trim();

    if (!firstName || !lastName) {
      throw new Error('Please enter first and last name.');
    }

    const updatedUser = await updateUser(token, editingUser.id, {
      firstName,
      lastName,
      email: user.email,
      password: user.password,
      role: user.role === 'admin' ? 'ADMIN' : user.role === 'pm' ? 'MANAGER' : 'EMPLOYEE',
    });

    setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: number) => {
    await deleteUser(token, userId);
    setUsers((current) => current.filter((user) => user.id !== userId));
  };

  if (loading) {
    return <div className="card"><div className="card-body">Loading users...</div></div>;
  }

  if (error) {
    return <div className="card"><div className="card-body">Users error: {error}</div></div>;
  }

  return (
    <div>
      {showModal ? <UserModal onClose={() => setShowModal(false)} onSave={handleCreateUser} /> : null}
      {editingUser ? (
        <UserModal
          mode="edit"
          initial={{
            name: `${editingUser.firstName} ${editingUser.lastName}`,
            email: editingUser.email,
            role:
              editingUser.role === 'ADMIN'
                ? 'admin'
                : editingUser.role === 'MANAGER'
                  ? 'pm'
                  : 'employee',
          }}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>
            User management
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {users.filter((user) => user.enabled).length} enabled, {users.length} total
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          Invite user
        </button>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card sc1">
          <div className="stat-lbl">Admins</div>
          <div className="stat-val">{users.filter((user) => user.role === 'ADMIN').length}</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Project managers</div>
          <div className="stat-val">{users.filter((user) => user.role === 'MANAGER').length}</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Employees</div>
          <div className="stat-val">{users.filter((user) => user.role === 'EMPLOYEE').length}</div>
        </div>
      </div>

      <div className="grid-lr">
        <div>
          <div className="filter-bar">
            <div className="filter-search">
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>[]</span>
              <input
                placeholder="Search a user..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value)}
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="MANAGER">Project managers</option>
              <option value="EMPLOYEE">Employees</option>
            </select>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          className="av"
                          style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleBadge[user.role] ?? 'b-gray'}`}>
                        {roleLabel[user.role] ?? user.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={`user-status-dot ${user.enabled ? 'us-active' : 'us-inactive'}`}
                        ></span>
                        <span style={{ fontSize: '12px' }}>
                          {user.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="action-btn" onClick={() => setEditingUser(user)}>
                          Edit
                        </button>
                        <button
                          className="action-btn action-btn-danger"
                          onClick={() => void handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Live summary</div>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="ai-insight">
                <span className="insight-ico">1.</span>
                <div className="insight-txt">
                  <strong>{users.length}</strong> users loaded from <strong>/api/users</strong>.
                </div>
              </div>
              <div className="ai-insight">
                <span className="insight-ico">2.</span>
                <div className="insight-txt">
                  <strong>{users.filter((user) => user.enabled).length}</strong> accounts are enabled.
                </div>
              </div>
              <div className="ai-insight">
                <span className="insight-ico">3.</span>
                <div className="insight-txt">
                  Most common role:{' '}
                  <strong>
                    {users.filter((user) => user.role === 'EMPLOYEE').length >=
                    users.filter((user) => user.role === 'MANAGER').length
                      ? 'Employee'
                      : 'Project Manager'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
