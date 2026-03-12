'use client';
import { useState } from 'react';

interface TaskModalProps {
    onClose: () => void;
    onSave?: (task: TaskData) => void;
    initial?: Partial<TaskData>;
    mode?: 'create' | 'edit';
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
    title: '', description: '', project: 'App Mobile', assignee: '',
    dueDate: '', priority: 'medium', status: 'todo', progress: 0, tags: [],
};

const members = ['Sofia Amrani', 'Karima Tahiri', 'Hassan Benjelloun', 'Youssef El Amrani', 'Nadia Alami'];
const projects = ['Refonte Site Web', 'Application Mobile', 'Campagne Q2', 'Design System', 'Dashboard Analytics'];

export default function TaskModal({ onClose, onSave, initial, mode = 'create' }: TaskModalProps) {
    const [form, setForm] = useState<TaskData>({ ...defaultTask, ...initial });
    const [tagInput, setTagInput] = useState('');

    const set = <K extends keyof TaskData>(field: K, value: TaskData[K]) => setForm(f => ({ ...f, [field]: value }));

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            set('tags', [...form.tags, tagInput.trim()]);
            setTagInput('');
        }
    };
    const removeTag = (i: number) => set('tags', form.tags.filter((_, idx) => idx !== i));

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <div className="modal-title">{mode === 'create' ? '＋ Nouvelle tâche' : '✏ Modifier la tâche'}</div>
                    <div className="modal-close" onClick={onClose}>✕</div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Titre de la tâche *</label>
                        <input className="form-input" placeholder="Ex: Intégration API paiement Stripe" value={form.title} onChange={e => set('title', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" placeholder="Décrivez la tâche en détail..." value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>
                    <div className="form-row" style={{ marginBottom: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Projet</label>
                            <select className="form-select" value={form.project} onChange={e => set('project', e.target.value)}>
                                {projects.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Assigné à</label>
                            <select className="form-select" value={form.assignee} onChange={e => set('assignee', e.target.value)}>
                                <option value="">— Choisir —</option>
                                {members.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row-3" style={{ marginBottom: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Échéance</label>
                            <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Priorité</label>
                            <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                                <option value="low">Faible</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Élevée</option>
                                <option value="critical">Critique</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Statut</label>
                            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="backlog">Backlog</option>
                                <option value="todo">À faire</option>
                                <option value="inprogress">En cours</option>
                                <option value="done">Terminé</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Avancement — {form.progress}%</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input type="range" className="progress-slider" min={0} max={100} value={form.progress} onChange={e => set('progress', parseInt(e.target.value))} style={{ flex: 1 }} />
                            <div className="pbar" style={{ width: '80px', height: '8px' }}>
                                <div className="pfill" style={{ width: `${form.progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div className="tag-input-wrap">
                            {form.tags.map((t, i) => (
                                <span key={i} className="tag-chip">{t}<span className="tag-chip-remove" onClick={() => removeTag(i)}>✕</span></span>
                            ))}
                            <input
                                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '12px', minWidth: '80px' }}
                                placeholder="Ajouter un tag..."
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={addTag}
                            />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                    <button className="btn btn-primary" onClick={() => { onSave?.(form); onClose(); }}>
                        {mode === 'create' ? '＋ Créer la tâche' : '💾 Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
