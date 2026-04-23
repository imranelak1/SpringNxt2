'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createTaskComment, getTaskComments } from '../lib/api';
import type { TaskComment } from '../lib/types';

interface TaskDetailPanelProps {
  task: {
    id: number;
    title: string;
    tag: string;
    tagCls: string;
    status: string;
    priority: string;
    assignee: string;
    assigneeInitials: string;
    dueDate: string;
    progress: number;
    project: string;
  };
  token: string;
  userInitials?: string;
  onProgressSave: (progress: number) => Promise<void>;
  onClose: () => void;
}


function formatCommentTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function initialsFromName(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export default function TaskDetailPanel({ task, token, userInitials = 'ME', onProgressSave, onClose }: TaskDetailPanelProps) {
  const [progress, setProgress] = useState(task.progress);
  const [progressDirty, setProgressDirty] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setProgress(task.progress);
    setProgressDirty(false);
    setProgressError('');
  }, [task.id, task.progress]);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setLoadingComments(true);
      setCommentError('');
      try {
        const response = await getTaskComments(token, task.id);
        if (isMounted) {
          setComments(response);
        }
      } catch (error) {
        if (isMounted) {
          setCommentError(error instanceof Error ? error.message : 'Impossible de charger les commentaires.');
        }
      } finally {
        if (isMounted) {
          setLoadingComments(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [task.id, token]);

  const addComment = async () => {
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    setCommentError('');

    try {
      const created = await createTaskComment(token, task.id, commentText.trim());
      setComments((current) => [created, ...current]);
      setCommentText('');
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Impossible d\'ajouter le commentaire.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags((t) => [...t, tagInput.trim()]);
      setTagInput('');
    }
  };

  const saveProgress = async () => {
    if (!progressDirty) return;

    setSavingProgress(true);
    setProgressError('');

    try {
      await onProgressSave(progress);
      setProgressDirty(false);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Impossible de sauvegarder la progression.');
    } finally {
      setSavingProgress(false);
    }
  };

  const priBadge =
    {
      Haute: 'pri-high',
      Critique: 'pri-critical',
      Moyenne: 'pri-medium',
      Faible: 'pri-low',
    }[task.priority] || 'pri-medium';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="task-panel-overlay" onClick={onClose} />
      <div className="task-panel">
        <div className="task-panel-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span className={`task-tag ${task.tagCls}`}>{task.tag}</span>
              <span className={`pri-badge ${priBadge}`}>{task.priority}</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.35 }}>{task.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>{task.project}</div>
          </div>
          <div className="modal-close" onClick={onClose}>x</div>
        </div>

        <div className="task-panel-body">
          <div className="task-panel-section">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Assigne
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div
                    className="av"
                    style={{ width: '22px', height: '22px', fontSize: '8px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}
                  >
                    {task.assigneeInitials}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{task.assignee}</span>
                </div>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Echeance
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--accent3)' }}>{task.dueDate}</div>
              </div>
            </div>
          </div>

          <div className="task-panel-section">
            <div className="task-panel-section-title">Avancement - {progress}%</div>
            <input
              type="range"
              className="progress-slider"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => {
                setProgress(parseInt(e.target.value, 10));
                setProgressDirty(true);
              }}
              onMouseUp={() => void saveProgress()}
              onTouchEnd={() => void saveProgress()}
            />
            <div className="pbar" style={{ height: '6px', marginTop: '8px' }}>
              <div className="pfill" style={{ width: `${progress}%` }}></div>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: progressError ? 'var(--accent3)' : 'var(--text-muted)' }}>
                {progressError
                  ? progressError
                  : savingProgress
                    ? 'Sauvegarde...'
                    : progressDirty
                      ? 'Modification non enregistree'
                      : 'Progression synchronisee'}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!progressDirty || savingProgress}
                onClick={() => void saveProgress()}
              >
                Enregistrer
              </button>
            </div>
          </div>

          <div className="task-panel-section">
            <div className="task-panel-section-title">Tags</div>
            <div className="tag-input-wrap">
              {tags.map((t, i) => (
                <span key={i} className="tag-chip">
                  {t}
                  <span className="tag-chip-remove" onClick={() => setTags((tt) => tt.filter((_, idx) => idx !== i))}>
                    x
                  </span>
                </span>
              ))}
              <input
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '12px', minWidth: '80px' }}
                placeholder="Ajouter tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>

          <div className="task-panel-section">
            <div className="task-panel-section-title">Commentaires ({comments.length})</div>
            {loadingComments ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chargement...</div> : null}
            {commentError ? (
              <div style={{ fontSize: '12px', color: 'var(--accent3)', marginBottom: '8px' }}>{commentError}</div>
            ) : null}
            {!loadingComments && comments.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Aucun commentaire pour cette tache.
              </div>
            ) : null}
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div
                  className="av"
                  style={{ width: '26px', height: '26px', fontSize: '9px', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0 }}
                >
                  {initialsFromName(c.authorName)}
                </div>
                <div className="comment-body">
                  <div className="comment-author">{c.authorName}</div>
                  <div className="comment-text">{c.text}</div>
                  <div className="comment-time">{formatCommentTime(c.createdAt)}</div>
                </div>
              </div>
            ))}
            <div className="comment-input">
              <div
                className="av"
                style={{ width: '26px', height: '26px', fontSize: '9px', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0 }}
              >
                {userInitials}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <input
                  className="form-input"
                  style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                  placeholder="Ajouter un commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void addComment();
                    }
                  }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => void addComment()} disabled={submittingComment}>
                  {submittingComment ? '...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>

          <div className="task-panel-section">
            <div className="task-panel-section-title">Historique des modifications</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Aucun historique disponible.
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
