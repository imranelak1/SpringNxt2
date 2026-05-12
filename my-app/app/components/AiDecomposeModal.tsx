'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { decomposeTasks } from '../lib/api';
import { archiveAiGeneration } from '../lib/aiArchive';
import type { Project } from '../lib/types';

interface AiDecomposeModalProps {
  token: string;
  projects: Project[];
  onClose: () => void;
  onAddTasks: (titles: string[], projectId: number) => Promise<void>;
}

export default function AiDecomposeModal({ token, projects, onClose, onAddTasks }: AiDecomposeModalProps) {
  const [goal, setGoal] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
    projects[0]?.id ?? ''
  );
  const [tasks, setTasks] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);

  const generate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    setTasks([]);
    setSelected(new Set());
    setValidated(false);
    try {
      const res = await decomposeTasks(token, goal.trim(), selectedProjectId || undefined);
      const lines = res.content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 3);
      setTasks(lines);
      setSelected(new Set(lines.map((_, i) => i)));
    } catch {
      setError('Erreur lors de la génération. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });

  const handleAdd = async () => {
    if (selected.size === 0 || !selectedProjectId) return;
    setAdding(true);
    const titles = tasks.filter((_, i) => selected.has(i));
    try {
      await onAddTasks(titles, Number(selectedProjectId));
      onClose();
    } catch {
      setError('Erreur lors de la création des tâches.');
    } finally {
      setAdding(false);
    }
  };

  const validateGeneration = () => {
    archiveAiGeneration({
      type: 'task-decomposition',
      title: goal.trim() || 'Taches generees',
      payload: {
        goal,
        projectId: selectedProjectId || null,
        tasks,
        selectedTasks: tasks.filter((_, i) => selected.has(i)),
      },
    });
    setValidated(true);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="ai-badge">✦ IA</span>
            <div className="modal-title">Décomposer un objectif avec l&apos;IA</div>
          </div>
          <div className="modal-close" onClick={onClose}><X size={14} strokeWidth={2.5} /></div>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Projet cible</label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Décrivez l&apos;objectif à atteindre</label>
            <textarea
              className="form-textarea"
              placeholder="Ex : Mettre en place un système d'authentification OAuth2 avec refresh token..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => void generate()}
            disabled={loading || !goal.trim()}
            style={{ width: '100%', marginBottom: tasks.length ? '16px' : 0 }}
          >
            {loading ? '✦ Génération en cours…' : '✦ Générer les tâches'}
          </button>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--accent3)', padding: '10px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: '8px', marginTop: '8px' }}>
              {error}
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {tasks.length} tâches générées — sélectionnez celles à ajouter :
                <span className={`badge ${validated ? 'b-green' : 'b-yellow'}`} style={{ marginLeft: '8px' }}>
                  {validated ? 'Archivee' : 'A valider'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tasks.map((t, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                      background: selected.has(i) ? 'rgba(61,138,255,0.08)' : 'var(--surface2)',
                      border: `1px solid ${selected.has(i) ? 'var(--accent)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleTask(i)}
                      style={{ marginTop: '2px', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>{t}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-ghost" onClick={() => void generate()} disabled={loading}>
              Regenerer
            </button>
            <button className="btn btn-primary" onClick={validateGeneration} disabled={validated}>
              {validated ? 'Valide et archive' : 'Valider'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void handleAdd()}
              disabled={adding || selected.size === 0 || !selectedProjectId || !validated}
            >
              {adding ? 'Création…' : `Ajouter ${selected.size} tâche${selected.size > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

