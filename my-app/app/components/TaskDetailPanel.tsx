'use client';
import { useState } from 'react';

interface TaskDetailPanelProps {
    task: {
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
    onClose: () => void;
}

const initialComments = [
    { author: 'Sofia Amrani', initials: 'SA', text: 'Penser à gérer les erreurs 402 et 429 de l\'API Stripe.', time: 'Il y a 2h' },
    { author: 'Hassan Benjelloun', initials: 'HB', text: 'Module webhook configuré, testé en staging. ✓', time: 'Il y a 1h' },
];

const history = [
    { text: 'Statut changé de "À faire" → "En cours"', time: 'Auj. 09:12' },
    { text: 'Assigné à Hassan Benjelloun', time: 'Hier 16:30' },
    { text: 'Priorité changée en "Haute"', time: 'Hier 14:00' },
    { text: 'Tâche créée', time: '1 Mar 11:45' },
];

export default function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
    const [progress, setProgress] = useState(task.progress);
    const [comments, setComments] = useState(initialComments);
    const [commentText, setCommentText] = useState('');
    const [tags, setTags] = useState(['API', 'Paiement', 'Sprint 9']);
    const [tagInput, setTagInput] = useState('');

    const addComment = () => {
        if (!commentText.trim()) return;
        setComments(c => [...c, { author: 'Sofia Amrani', initials: 'SA', text: commentText, time: 'À l\'instant' }]);
        setCommentText('');
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            setTags(t => [...t, tagInput.trim()]);
            setTagInput('');
        }
    };

    const priBadge = {
        'Haute': 'pri-high', 'Critique': 'pri-critical', 'Moyenne': 'pri-medium', 'Faible': 'pri-low'
    }[task.priority] || 'pri-medium';

    return (
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
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>📁 {task.project}</div>
                    </div>
                    <div className="modal-close" onClick={onClose}>✕</div>
                </div>

                <div className="task-panel-body">
                    {/* Meta */}
                    <div className="task-panel-section">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 12px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Assigné</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <div className="av" style={{ width: '22px', height: '22px', fontSize: '8px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>{task.assigneeInitials}</div>
                                    <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{task.assignee}</span>
                                </div>
                            </div>
                            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 12px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Échéance</div>
                                <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--accent3)' }}>📅 {task.dueDate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="task-panel-section">
                        <div className="task-panel-section-title">Avancement — {progress}%</div>
                        <input type="range" className="progress-slider" min={0} max={100} value={progress} onChange={e => setProgress(parseInt(e.target.value))} />
                        <div className="pbar" style={{ height: '6px', marginTop: '8px' }}>
                            <div className="pfill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="task-panel-section">
                        <div className="task-panel-section-title">Tags</div>
                        <div className="tag-input-wrap">
                            {tags.map((t, i) => (
                                <span key={i} className="tag-chip">{t}
                                    <span className="tag-chip-remove" onClick={() => setTags(tt => tt.filter((_, idx) => idx !== i))}>✕</span>
                                </span>
                            ))}
                            <input
                                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '12px', minWidth: '80px' }}
                                placeholder="Ajouter tag..."
                                value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                            />
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="task-panel-section">
                        <div className="task-panel-section-title">Commentaires ({comments.length})</div>
                        {comments.map((c, i) => (
                            <div key={i} className="comment-item">
                                <div className="av" style={{ width: '26px', height: '26px', fontSize: '9px', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0 }}>{c.initials}</div>
                                <div className="comment-body">
                                    <div className="comment-author">{c.author}</div>
                                    <div className="comment-text">{c.text}</div>
                                    <div className="comment-time">{c.time}</div>
                                </div>
                            </div>
                        ))}
                        <div className="comment-input">
                            <div className="av" style={{ width: '26px', height: '26px', fontSize: '9px', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0 }}>SA</div>
                            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                <input
                                    className="form-input" style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                                    placeholder="Ajouter un commentaire..."
                                    value={commentText} onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addComment()}
                                />
                                <button className="btn btn-primary btn-sm" onClick={addComment}>↵</button>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="task-panel-section">
                        <div className="task-panel-section-title">Historique des modifications</div>
                        {history.map((h, i) => (
                            <div key={i} className="hist-item">
                                <div className="hist-dot"></div>
                                <div className="hist-text">{h.text}</div>
                                <div className="hist-time">{h.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
