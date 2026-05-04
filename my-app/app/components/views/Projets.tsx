'use client';

import { useEffect, useRef, useState } from 'react';
import ProjectModal, { type ProjectData } from '../ProjectModal';
import { createProject, deleteProject, getProjects, updateProject, analyzeProjectRisk } from '../../lib/api';
import { SkeletonTable } from '../Skeleton';
import type { AppRole, Project } from '../../lib/types';

interface ProjetsProps {
  token: string;
  role: AppRole;
  isActive?: boolean;
}

const filters = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
];

function formatDate(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function getStatusClass(status: string) {
  if (status === 'ACTIVE') {
    return 'b-green';
  }

  if (status === 'COMPLETED') {
    return 'b-blue';
  }

  if (status === 'ON_HOLD') {
    return 'b-yellow';
  }

  return 'b-gray';
}

export default function Projets({ token, role, isActive }: ProjetsProps) {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive && !wasActive.current) setRefreshKey((k) => k + 1);
    wasActive.current = isActive ?? false;
  }, [isActive]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [riskPanel, setRiskPanel] = useState<{ projectId: number; content: string; loading: boolean } | null>(null);

  const handleAnalyzeRisk = (projectId: number) => {
    if (riskPanel?.projectId === projectId && !riskPanel.loading) {
      setRiskPanel(null);
      return;
    }
    setRiskPanel({ projectId, content: '', loading: true });
    analyzeProjectRisk(token, projectId)
      .then((res) => setRiskPanel({ projectId, content: res.content, loading: false }))
      .catch(() => setRiskPanel({ projectId, content: 'Analyse indisponible. Vérifiez votre clé GROQ_API_KEY.', loading: false }));
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setLoading(true);
      setError('');

      try {
        const response = await getProjects(token, undefined, selectedStatus);

        if (isMounted) {
          setProjects(response.content);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [selectedStatus, token, refreshKey]);

  if (role === 'employee') {
    return <div className="card"><div className="card-body">Projects are limited to admin and manager roles.</div></div>;
  }

  const handleCreateProject = async (project: ProjectData) => {
    const description = [project.description, project.client ? `Client: ${project.client}` : '']
      .filter(Boolean)
      .join('\n\n');

    const createdProject = await createProject(token, {
      name: project.name,
      description,
      status:
        project.status === 'active'
          ? 'ACTIVE'
          : project.status === 'planning'
            ? 'PLANNING'
            : project.status === 'paused'
              ? 'ON_HOLD'
              : project.status === 'done'
                ? 'COMPLETED'
                : 'CANCELLED',
      startDate: project.startDate || null,
      endDate: project.endDate || null,
      budget: project.budget ? Number(project.budget) : null,
      spentAmount: project.spentAmount ? Number(project.spentAmount) : null,
      progressPercentage: 0,
    });

    setProjects((current) => [createdProject, ...current]);
  };

  const handleUpdateProject = async (projectData: ProjectData) => {
    if (!editingProject) {
      return;
    }

    const description = [projectData.description, projectData.client ? `Client: ${projectData.client}` : '']
      .filter(Boolean)
      .join('\n\n');

    const updatedProject = await updateProject(token, editingProject.id, {
      name: projectData.name,
      description,
      status:
        projectData.status === 'active'
          ? 'ACTIVE'
          : projectData.status === 'planning'
            ? 'PLANNING'
            : projectData.status === 'paused'
              ? 'ON_HOLD'
              : projectData.status === 'done'
                ? 'COMPLETED'
                : 'CANCELLED',
      startDate: projectData.startDate || null,
      endDate: projectData.endDate || null,
      budget: projectData.budget ? Number(projectData.budget) : null,
      spentAmount: projectData.spentAmount ? Number(projectData.spentAmount) : null,
      progressPercentage: editingProject.progressPercentage ?? 0,
    });

    setProjects((current) =>
      current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
    );
    setEditingProject(null);
  };

  const handleDeleteProject = async (projectId: number) => {
    await deleteProject(token, projectId);
    setProjects((current) => current.filter((project) => project.id !== projectId));
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
      {showModal ? (
        <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreateProject} />
      ) : null}
      {editingProject ? (
        <ProjectModal
          mode="edit"
          initial={{
            name: editingProject.name,
            description: editingProject.description,
            client: '',
            startDate: editingProject.startDate ?? '',
            endDate: editingProject.endDate ?? '',
            budget: editingProject.budget?.toString() ?? '',
            spentAmount: editingProject.spentAmount?.toString() ?? '',
            status:
              editingProject.status === 'ACTIVE'
                ? 'active'
                : editingProject.status === 'PLANNING'
                  ? 'planning'
                  : editingProject.status === 'ON_HOLD'
                    ? 'paused'
                    : editingProject.status === 'COMPLETED'
                      ? 'done'
                      : 'archived',
            priority: 'medium',
            team: [],
          }}
          onClose={() => setEditingProject(null)}
          onSave={handleUpdateProject}
        />
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>
            Project portfolio
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {projects.length} projects loaded from the backend
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filters.map((filter) => (
            <span
              key={filter.value}
              className={`tag ${selectedStatus === filter.value ? 'sel' : ''}`}
              onClick={() => setSelectedStatus(filter.value)}
            >
              {filter.label}
            </span>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          New project
        </button>
      </div>

      <div className="grid-3 mb18">
        {projects.map((project) => (
          <div key={project.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'rgba(79,255,176,0.1)',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  {project.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{project.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Created {formatDate(project.createdAt)}
                  </div>
                </div>
                <span className={`badge ${getStatusClass(project.status)}`}>{project.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '12px' }}>
                {project.description || 'No description provided for this project yet.'}
              </div>
              <div className="pbar-wrap">
                <div className="pbar" style={{ height: '7px' }}>
                  <div className="pfill" style={{ width: `${project.progressPercentage ?? 0}%` }}></div>
                </div>
                <span className="ppct" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {project.progressPercentage ?? 0}%
                </span>
              </div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>
                Due: <span style={{ color: 'var(--text)' }}>{formatDate(project.endDate)}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Tasks: <span style={{ color: 'var(--accent2)' }}>{project.taskCount}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Members: <span style={{ color: 'var(--accent4)' }}>{project.memberCount}</span>
              </div>
            </div>
            <div style={{ padding: '0 18px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="action-btn" onClick={() => setEditingProject(project)}>Edit</button>
              <button className="action-btn action-btn-danger" onClick={() => void handleDeleteProject(project.id)}>Delete</button>
              <button
                className="action-btn"
                style={{ marginLeft: 'auto', color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: '11px' }}
                onClick={() => handleAnalyzeRisk(project.id)}
              >
                {riskPanel?.projectId === project.id && riskPanel.loading ? '…' : '✦ Risque IA'}
              </button>
            </div>
            {riskPanel?.projectId === project.id && !riskPanel.loading && riskPanel.content && (
              <div style={{
                margin: '0 18px 16px', padding: '12px 14px', borderRadius: '8px',
                background: 'rgba(61,138,255,0.06)', border: '1px solid rgba(61,138,255,0.2)',
                fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span className="ai-badge" style={{ fontSize: '10px' }}>✦ IA</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Analyse de risque</span>
                </div>
                {riskPanel.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
