'use client';
import { useState } from 'react';

interface ProjectModalProps {
    onClose: () => void;
    onSave?: (project: ProjectData) => void;
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
    status: string;
    priority: string;
    team: string[];
}

const defaultProject: ProjectData = {
    name: '', description: '', client: '', startDate: '', endDate: '',
    budget: '', status: 'active', priority: 'medium', team: [],
};

export default function ProjectModal({ onClose, onSave, initial, mode = 'create' }: ProjectModalProps) {
    const [form, setForm] = useState<ProjectData>({ ...defaultProject, ...initial });

    const set = (field: keyof ProjectData, value: string) => setForm(f => ({ ...f, [field]: value }));

    const healthScore = () => {
        if (!form.name) return null;
        const scores = [
            form.startDate && form.endDate ? 90 : 50,
            form.description.length > 20 ? 95 : 60,
            form.budget ? 85 : 40,
            form.priority === 'critical' ? 70 : 88,
        ];
        return Math.round(scores.reduce((a, b) => a + b) / scores.length);
    };

    const hs = healthScore();
    const hsColor = hs === null ? 'var(--text-muted)' : hs >= 80 ? 'var(--accent)' : hs >= 60 ? 'var(--accent4)' : hs >= 40 ? 'var(--accent3)' : '#ff3333';

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <div className="modal-title">{mode === 'create' ? '＋ Nouveau projet' : '✏ Modifier le projet'}</div>
                    <div className="modal-close" onClick={onClose}>✕</div>
                </div>
                <div className="modal-body">
                    <div className="form-row" style={{ marginBottom: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nom du projet *</label>
                            <input className="form-input" placeholder="Ex: Refonte Site Web" value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Client</label>
                            <input className="form-input" placeholder="Ex: TechCorp Maroc" value={form.client} onChange={e => set('client', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" placeholder="Décrivez le périmètre du projet..." value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>
                    <div className="form-row" style={{ marginBottom: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Date de début</label>
                            <input className="form-input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Date de fin</label>
                            <input className="form-input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-row-3" style={{ marginBottom: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Budget (MAD)</label>
                            <input className="form-input" type="number" placeholder="120000" value={form.budget} onChange={e => set('budget', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Statut</label>
                            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="draft">Brouillon</option>
                                <option value="active">En cours</option>
                                <option value="review">En révision</option>
                                <option value="paused">En pause</option>
                                <option value="done">Livré</option>
                                <option value="archived">Archivé</option>
                            </select>
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
                    </div>

                    {hs !== null && (
                        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aperçu score santé</div>
                            <div style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '22px', fontWeight: 800, color: hsColor }}>{hs}</div>
                            <div className="pbar" style={{ flex: 1, height: '8px' }}>
                                <div className="pfill" style={{ width: `${hs}%`, background: hsColor }}></div>
                            </div>
                            <div style={{ fontSize: '11px', color: hsColor, fontWeight: 600 }}>
                                {hs >= 80 ? '🟢 Bon' : hs >= 60 ? '🟡 Attention' : hs >= 40 ? '🔴 Risque' : '🚨 Critique'}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                    <button className="btn btn-primary" onClick={() => { onSave?.(form); onClose(); }}>
                        {mode === 'create' ? '＋ Créer le projet' : '💾 Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
