'use client';

import { useEffect, useMemo, useState } from 'react';
import ProjectMemberModal, { type ProjectMemberFormData } from '../ProjectMemberModal';
import {
  createProjectMember,
  deleteProjectMember,
  getProjectMembers,
  getProjects,
  getUsers,
  updateProjectMember,
} from '../../lib/api';
import type { AppRole, Project, ProjectMember, UserSummary } from '../../lib/types';

interface RessourcesProps {
  token: string;
  role: AppRole;
}

interface ResourceRow {
  userId: number;
  fullName: string;
  email: string;
  projectCount: number;
  totalAllocation: number;
  roles: string[];
  projectNames: string[];
}

function getAvailabilityBadge(totalAllocation: number) {
  if (totalAllocation > 100) {
    return { label: 'Overloaded', badge: 'b-red', fill: 'var(--accent3)' };
  }

  if (totalAllocation >= 75) {
    return { label: 'Busy', badge: 'b-yellow', fill: 'var(--accent4)' };
  }

  return { label: 'Available', badge: 'b-green', fill: 'var(--accent)' };
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export default function Ressources({ token, role }: RessourcesProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResources() {
      setLoading(true);
      setError('');

      try {
        const [projectsResponse, usersResponse] = await Promise.all([getProjects(token), getUsers(token)]);
        const memberResponses = await Promise.all(
          projectsResponse.content.map((project) => getProjectMembers(token, project.id)),
        );

        if (isMounted) {
          setProjects(projectsResponse.content);
          setUsers(usersResponse);
          setMembers(memberResponses.flat());
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load resources.');
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

    void loadResources();

    return () => {
      isMounted = false;
    };
  }, [role, token]);

  const resourceRows = useMemo(() => {
    const grouped = new Map<number, ResourceRow>();

    members.forEach((member) => {
      const existing = grouped.get(member.userId);
      const fullName = `${member.firstName} ${member.lastName}`;
      const allocation = member.allocationPercentage ?? 0;

      if (!existing) {
        grouped.set(member.userId, {
          userId: member.userId,
          fullName,
          email: member.userEmail,
          projectCount: 1,
          totalAllocation: allocation,
          roles: [member.role],
          projectNames: [member.projectName],
        });
        return;
      }

      existing.projectCount += 1;
      existing.totalAllocation += allocation;
      existing.roles = Array.from(new Set([...existing.roles, member.role]));
      existing.projectNames = Array.from(new Set([...existing.projectNames, member.projectName]));
    });

    return Array.from(grouped.values()).sort(
      (left, right) => right.totalAllocation - left.totalAllocation,
    );
  }, [members]);

  const averageAllocation =
    resourceRows.length > 0
      ? Math.round(
          resourceRows.reduce((sum, row) => sum + row.totalAllocation, 0) / resourceRows.length,
        )
      : 0;

  const handleCreateMember = async (form: ProjectMemberFormData) => {
    if (!form.projectId || !form.userId) {
      throw new Error('Please choose both a project and a user.');
    }

    const createdMember = await createProjectMember(token, {
      projectId: Number(form.projectId),
      userId: Number(form.userId),
      role: form.role,
      allocationPercentage: form.allocationPercentage ? Number(form.allocationPercentage) : null,
    });

    setMembers((current) => [...current, createdMember]);
  };

  const handleUpdateMember = async (form: ProjectMemberFormData) => {
    if (!editingMember) {
      return;
    }

    const updatedMember = await updateProjectMember(token, editingMember.id, {
      projectId: Number(form.projectId),
      userId: Number(form.userId),
      role: form.role,
      allocationPercentage: form.allocationPercentage ? Number(form.allocationPercentage) : null,
    });

    setMembers((current) =>
      current.map((member) => (member.id === updatedMember.id ? updatedMember : member)),
    );
    setEditingMember(null);
  };

  const handleDeleteMember = async (memberId: number) => {
    await deleteProjectMember(token, memberId);
    setMembers((current) => current.filter((member) => member.id !== memberId));
  };

  if (role === 'employee') {
    return <div className="card"><div className="card-body">Resources are intended for manager and admin roles.</div></div>;
  }

  if (loading) {
    return <div className="card"><div className="card-body">Loading resources...</div></div>;
  }

  if (error) {
    return <div className="card"><div className="card-body">Resources error: {error}</div></div>;
  }

  return (
    <div>
      {showModal ? (
        <ProjectMemberModal
          onClose={() => setShowModal(false)}
          onSave={handleCreateMember}
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          users={users.map((user) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          }))}
        />
      ) : null}
      {editingMember ? (
        <ProjectMemberModal
          mode="edit"
          initial={{
            projectId: editingMember.projectId.toString(),
            userId: editingMember.userId.toString(),
            role: editingMember.role,
            allocationPercentage: editingMember.allocationPercentage?.toString() ?? '0',
          }}
          onClose={() => setEditingMember(null)}
          onSave={handleUpdateMember}
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          users={users.map((user) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          }))}
        />
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>
            Resource management
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {resourceRows.length} members across {members.length} project assignments
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          Assign member
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card sc1">
          <div className="stat-lbl">Active members</div>
          <div className="stat-val">{resourceRows.length}</div>
          <div className="stat-chg">Loaded from project assignments</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-lbl">Overloaded</div>
          <div className="stat-val">
            {resourceRows.filter((row) => row.totalAllocation > 100).length}
          </div>
          <div className="stat-chg down">Allocation above 100%</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Average allocation</div>
          <div className="stat-val">{averageAllocation}%</div>
          <div className="stat-chg">Based on live member assignments</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Projects staffed</div>
          <div className="stat-val">{new Set(members.map((member) => member.projectId)).size}</div>
          <div className="stat-chg up">Distinct projects with members</div>
        </div>
      </div>

      <div className="card mb18">
        <div className="card-header">
          <div className="card-title">Project assignments</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Member</th>
              <th>Project</th>
              <th>Role</th>
              <th>Allocation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const availability = getAvailabilityBadge(member.allocationPercentage ?? 0);

              return (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div
                        className="av"
                        style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
                      >
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {member.firstName} {member.lastName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {member.userEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{member.projectName}</td>
                  <td style={{ fontSize: '12.5px' }}>{member.role}</td>
                  <td>
                    <div className="pbar-wrap">
                      <div className="pbar">
                        <div
                          className="pfill"
                          style={{
                            width: `${Math.min(member.allocationPercentage ?? 0, 100)}%`,
                            background: availability.fill,
                          }}
                        ></div>
                      </div>
                      <span className="ppct">{member.allocationPercentage ?? 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${availability.badge}`}>{availability.label}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="action-btn" onClick={() => setEditingMember(member)}>
                        Edit
                      </button>
                      <button
                        className="action-btn action-btn-danger"
                        onClick={() => void handleDeleteMember(member.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card mb18">
        <div className="card-header">
          <div className="card-title">Allocation by member</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Member</th>
              <th>Roles</th>
              <th>Projects</th>
              <th>Allocation</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {resourceRows.map((row) => {
              const availability = getAvailabilityBadge(row.totalAllocation);

              return (
                <tr key={row.userId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div
                        className="av"
                        style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
                      >
                        {row.fullName
                          .split(' ')
                          .map((part) => part[0] ?? '')
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{row.fullName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px' }}>{row.roles.join(', ')}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    {row.projectNames.join(' · ')}
                  </td>
                  <td>
                    <div className="pbar-wrap">
                      <div className="pbar">
                        <div
                          className="pfill"
                          style={{
                            width: `${Math.min(row.totalAllocation, 100)}%`,
                            background: availability.fill,
                          }}
                        ></div>
                      </div>
                      <span className="ppct">{row.totalAllocation}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${availability.badge}`}>{availability.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ai-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="ai-badge">API</span>
          <span className="ai-title">Allocation insights</span>
        </div>
        <div className="ai-insight">
          <span className="insight-ico">1.</span>
          <div className="insight-txt">
            Highest allocation:{' '}
            <strong>
              {resourceRows[0]
                ? `${resourceRows[0].fullName} (${resourceRows[0].totalAllocation}%)`
                : 'No data'}
            </strong>
          </div>
        </div>
        <div className="ai-insight">
          <span className="insight-ico">2.</span>
          <div className="insight-txt">
            Total assignments loaded from <strong>/api/project-members</strong>: <strong>{members.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
