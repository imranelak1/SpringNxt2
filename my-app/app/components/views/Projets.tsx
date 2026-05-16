'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ProjectModal, { type ProjectData } from '../ProjectModal';
import ProjectWorkspace from './ProjectWorkspace';
import { createProject, deleteProject, getProjects, updateProject, analyzeProjectRisk } from '../../lib/api';
import { archiveAiGeneration } from '../../lib/aiArchive';
import { SkeletonTable } from '../Skeleton';
import { useAlert } from '../AlertProvider';
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

function normalizeGitHubRepo(repo: string | null) {
  if (!repo) return null;
  return repo
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\/+$/, '') || null;
}

export default function Projets({ token, role, isActive }: ProjetsProps) {
  const alerts = useAlert();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analysisOverlayOpen, setAnalysisOverlayOpen] = useState(false);
  const wasActive = useRef(false);

  const validateRiskAnalysis = (project: Project) => {
    if (!riskPanel?.content) return;
    archiveAiGeneration({
      type: 'project-risk',
      title: `Risque IA - ${project.name}`,
      payload: { projectId: project.id, projectName: project.name, content: riskPanel.content },
    });
    setRiskPanel((current) => current ? { ...current, validated: true } : current);
    setAnalysisOverlayOpen(false);
  };

  useEffect(() => {
    if (isActive && !wasActive.current) setRefreshKey((k) => k + 1);
    wasActive.current = isActive ?? false;
  }, [isActive]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [riskPanel, setRiskPanel] = useState<{
    projectId: number;
    content: string;
    loading: boolean;
    validated?: boolean;
    fullContent?: string;
  } | null>(null);

  const generationTimer = useRef<number | null>(null);

  const clearGenerationTimer = () => {
    if (generationTimer.current !== null) {
      window.clearTimeout(generationTimer.current);
      generationTimer.current = null;
    }
  };

  const revealContentLineByLine = (projectId: number, text: string) => {
    const lines = text.split('\n');
    let currentText = '';
    let index = 0;

    const addNextLine = () => {
      if (index >= lines.length) {
        setRiskPanel((current) => current && current.projectId === projectId ? { ...current, content: text, loading: false } : current);
        clearGenerationTimer();
        return;
      }

      currentText += (index > 0 ? '\n' : '') + lines[index];
      index += 1;
      setRiskPanel((current) => current && current.projectId === projectId ? { ...current, content: currentText, fullContent: text, loading: true } : current);
      generationTimer.current = window.setTimeout(addNextLine, 60);
    };

    addNextLine();
  };

  const handleAnalyzeRisk = (projectId: number, force = false) => {
    if (!force && riskPanel?.projectId === projectId && !riskPanel.loading) {
      setRiskPanel(null);
      setAnalysisOverlayOpen(false);
      clearGenerationTimer();
      return;
    }
    clearGenerationTimer();
    setRiskPanel({ projectId, content: '', loading: true, validated: false, fullContent: '' });
    setAnalysisOverlayOpen(true);
    analyzeProjectRisk(token, projectId)
      .then((res) => revealContentLineByLine(projectId, res.content))
      .catch(() => {
        clearGenerationTimer();
        setRiskPanel({ projectId, content: 'Analyse indisponible. Vérifiez votre clé GROQ_API_KEY.', loading: false, validated: false });
      });
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

  useEffect(() => {
    return () => {
      clearGenerationTimer();
    };
  }, []);

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
      githubRepo: project.githubRepo || null,
    });

    setProjects((current) => [createdProject, ...current]);
    alerts.success('Projet créé', `"${createdProject.name}" est maintenant dans le portfolio.`);
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
      githubRepo: projectData.githubRepo || null,
    });

    setProjects((current) =>
      current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
    );
    setEditingProject(null);
    alerts.success('Projet mis à jour', `"${updatedProject.name}" a été modifié.`);
  };

  const handleDeleteProject = async (projectId: number) => {
    const project = projects.find((item) => item.id === projectId);
    const confirmed = await alerts.confirm({
      title: 'Supprimer ce projet ?',
      message: project ? `"${project.name}" et ses données liées seront supprimés.` : 'Cette action est définitive.',
      confirmText: 'Supprimer',
      tone: 'warning',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(token, projectId);
      setProjects((current) => current.filter((item) => item.id !== projectId));
      alerts.success('Projet supprimé', project ? `"${project.name}" a été retiré.` : undefined);
    } catch (deleteError) {
      alerts.error('Suppression impossible', deleteError instanceof Error ? deleteError.message : 'Réessayez dans un instant.');
    }
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

  if (openProject) {
    return (
      <ProjectWorkspace
        project={openProject}
        token={token}
        role={role}
        onBack={() => setOpenProject(null)}
        onEdit={() => {
          setEditingProject(openProject);
          setOpenProject(null);
        }}
      />
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
          <div key={project.id} className="card" style={{ transition: 'all 0.2s' }}>
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
                  <div
                    style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setOpenProject(project)}
                  >
                    {project.name}
                  </div>
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
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}>Edit</button>
              <button className="action-btn action-btn-danger" onClick={(e) => { e.stopPropagation(); void handleDeleteProject(project.id); }}>Delete</button>
              {normalizeGitHubRepo(project.githubRepo) ? (
                <a
                  className="action-btn"
                  style={{ color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: '11px' }}
                  href={`https://github.com/${normalizeGitHubRepo(project.githubRepo)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  GitHub
                </a>
              ) : null}
              <button
                className="action-btn"
                style={{ marginLeft: 'auto', color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: '11px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyzeRisk(project.id);
                }}
              >
                {riskPanel?.projectId === project.id && riskPanel.loading ? '…' : '✦ Risque IA'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {analysisOverlayOpen && riskPanel ? (
        <div className="sweet-overlay" style={{ zIndex: 1300 }} onClick={() => setAnalysisOverlayOpen(false)}>
          <div className="sweet-dialog wide" onClick={(event) => event.stopPropagation()}>
            <button className="sweet-dialog-close" onClick={() => setAnalysisOverlayOpen(false)}>
              <X size={16} />
            </button>
            <div className="sweet-dialog-header">
              <div className="sweet-dialog-icon">
                <X size={24} />
              </div>
              <div className="sweet-dialog-title">Analyse de risque</div>
              <div className="sweet-dialog-subtitle">
                {riskPanel.loading ? 'Génération du contenu en cours…' : riskPanel.validated ? 'Archivée' : 'À valider'}
              </div>
            </div>
            <div className="sweet-dialog-content">
              <div className="sweet-dialog-text">
                {riskPanel.loading
                  ? 'Merci de patienter pendant la génération du contenu IA. Le fond est flouté pour vous aider à rester concentré.'
                  : riskPanel.content}
              </div>
            </div>
            <div className="sweet-dialog-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => handleAnalyzeRisk(riskPanel.projectId, true)}>
                Régénérer
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const project = projects.find((project) => project.id === riskPanel.projectId);
                  if (project) validateRiskAnalysis(project);
                }}
                disabled={riskPanel.loading || riskPanel.validated}
              >
                {riskPanel.validated ? 'Validé et archivé' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
