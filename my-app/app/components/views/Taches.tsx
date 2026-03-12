'use client';
import { useState } from 'react';
import TaskModal from '../TaskModal';
import TaskDetailPanel from '../TaskDetailPanel';

interface TaskInfo {
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
}

const kanbanColumns = {
    backlog: {
        label: 'BACKLOG', dot: 'var(--text-muted)', count: 8,
        tasks: [
            { title: 'Audit accessibilité WCAG 2.1', tag: 'Analyse', tagCls: 'tt-dat', status: 'backlog', priority: 'Faible', assignee: 'Non assigné', assigneeInitials: '?', dueDate: 'Non planifié', progress: 0, project: 'Interne' },
            { title: 'Refactoriser module notifications', tag: 'Dev', tagCls: 'tt-dev', status: 'backlog', priority: 'Moyenne', assignee: 'Non assigné', assigneeInitials: '?', dueDate: 'Non planifié', progress: 0, project: 'App Mobile' },
            { title: 'Dark mode — composants secondaires', tag: 'Design', tagCls: 'tt-des', status: 'backlog', priority: 'Faible', assignee: 'Karima Tahiri', assigneeInitials: 'KT', dueDate: 'Non planifié', progress: 10, project: 'Design System' },
        ],
    },
    todo: {
        label: 'À FAIRE', dot: 'var(--accent4)', count: 6,
        tasks: [
            { title: 'Wireframes page d\'accueil v2', tag: 'Design', tagCls: 'tt-des', status: 'todo', priority: 'Moyenne', assignee: 'Karima Tahiri', assigneeInitials: 'KT', dueDate: '10 Mar', progress: 0, project: 'Refonte Site Web' },
            { title: 'Setup CI/CD pipeline GitHub Actions', tag: 'Dev', tagCls: 'tt-dev', status: 'todo', priority: 'Moyenne', assignee: 'Youssef El Amrani', assigneeInitials: 'YE', dueDate: '12 Mar', progress: 0, project: 'App Mobile' },
            { title: 'Créatives visuelles réseaux sociaux Q2', tag: 'Marketing', tagCls: 'tt-mkt', status: 'todo', priority: 'Moyenne', assignee: 'Nadia Alami', assigneeInitials: 'NA', dueDate: '12 Mar', progress: 0, project: 'Campagne Q2' },
        ],
    },
    inprogress: {
        label: 'EN COURS', dot: 'var(--accent2)', count: 5,
        tasks: [
            { title: 'Intégration API paiement Stripe', tag: 'Dev', tagCls: 'tt-dev', status: 'inprogress', priority: 'Critique', assignee: 'Hassan Benjelloun', assigneeInitials: 'HB', dueDate: '8 Mar', progress: 65, project: 'App Mobile' },
            { title: 'Composants UI — bibliothèque interne', tag: 'Design', tagCls: 'tt-des', status: 'inprogress', priority: 'Moyenne', assignee: 'Karima Tahiri', assigneeInitials: 'KT', dueDate: 'En continu', progress: 55, project: 'Design System' },
            { title: 'Géolocalisation temps réel utilisateurs', tag: 'Dev', tagCls: 'tt-dev', status: 'inprogress', priority: 'Haute', assignee: 'Youssef El Amrani', assigneeInitials: 'YE', dueDate: '14 Mar', progress: 30, project: 'App Mobile' },
        ],
    },
    done: {
        label: 'TERMINÉ', dot: 'var(--accent)', count: 14,
        tasks: [
            { title: 'Tests unitaires module authentification', tag: 'QA', tagCls: 'tt-qa', status: 'done', priority: 'Haute', assignee: 'Hassan Benjelloun', assigneeInitials: 'HB', dueDate: '2 Mar', progress: 100, project: 'App Mobile' },
            { title: 'Charte graphique BrandMax finalisée', tag: 'Design', tagCls: 'tt-des', status: 'done', priority: 'Haute', assignee: 'Karima Tahiri', assigneeInitials: 'KT', dueDate: '1 Mar', progress: 100, project: 'Campagne Q2' },
            { title: 'Audit SEO site TechCorp Maroc', tag: 'Analyse', tagCls: 'tt-dat', status: 'done', priority: 'Faible', assignee: 'Sofia Amrani', assigneeInitials: 'SA', dueDate: '28 Fév', progress: 100, project: 'Refonte Site Web' },
        ],
    },
};

export default function Taches() {
    const [viewMode, setViewMode] = useState('Kanban');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskInfo | null>(null);

    return (
        <div>
            {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} />}
            {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Gestion des tâches</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>84 tâches · Sprint 9 · App Mobile</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['Kanban', 'Liste'].map(m => <span key={m} className={`tag ${viewMode === m ? 'sel' : ''}`} onClick={() => setViewMode(m)}>{m}</span>)}
                </div>

                <div className="filter-bar" style={{ marginBottom: 0 }}>
                    <select className="filter-select">
                        <option>Tous les projets</option>
                        <option>App Mobile</option>
                        <option>Refonte Site Web</option>
                    </select>
                    <select className="filter-select">
                        <option>Toutes priorités</option>
                        <option>Critique</option>
                        <option>Haute</option>
                        <option>Moyenne</option>
                    </select>
                </div>

                <button className="btn btn-ghost btn-sm">Filtrer ▾</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>＋ Tâche</button>
            </div>

            {viewMode === 'Kanban' && (
                <div className="kanban-grid">
                    {Object.entries(kanbanColumns).map(([key, col]) => (
                        <div key={key} className="kb-col">
                            <div className="kb-header">
                                <div className="kb-dot" style={{ background: col.dot }}></div>
                                <div className="kb-title">{col.label}</div>
                                <div className="kb-count">{col.count}</div>
                                <button className="action-btn" style={{ padding: '2px 6px', fontSize: '14px', fontWeight: 700 }} onClick={() => setShowTaskModal(true)}>＋</button>
                            </div>
                            {col.tasks.map((t, i) => (
                                <div key={i} className="task-card" style={{ borderColor: key === 'inprogress' ? 'rgba(61,138,255,0.2)' : '', opacity: key === 'done' ? 0.65 : 1 }} onClick={() => setSelectedTask(t)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <span className={`task-tag ${t.tagCls}`}>{t.tag}</span>
                                        <span className={`pri-badge ${t.priority === 'Critique' ? 'pri-critical' : t.priority === 'Haute' ? 'pri-high' : t.priority === 'Moyenne' ? 'pri-medium' : 'pri-low'}`}>{t.priority}</span>
                                    </div>
                                    <div className="task-title">{t.title}</div>
                                    {t.progress > 0 && t.progress < 100 && (
                                        <div className="pbar-wrap" style={{ marginBottom: '8px' }}>
                                            <div className="pbar"><div className="pfill" style={{ width: `${t.progress}%` }}></div></div>
                                            <span className="ppct" style={{ fontSize: '10px' }}>{t.progress}%</span>
                                        </div>
                                    )}
                                    <div className="task-footer">
                                        <span className="task-due" style={{ color: t.dueDate.includes('Mar') && parseInt(t.dueDate) <= 10 ? 'var(--accent3)' : '' }}>
                                            {key === 'done' ? `✓ ${t.dueDate}` : `📅 ${t.dueDate}`}
                                        </span>
                                        {t.assigneeInitials !== '?' && (
                                            <div className="av" style={{ width: '22px', height: '22px', fontSize: '9px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>{t.assigneeInitials}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {viewMode === 'Liste' && (
                <div className="card">
                    <table className="tbl">
                        <thead><tr><th>Tâche</th><th>Projet</th><th>Assigné</th><th>Priorité</th><th>Avancement</th><th>Échéance</th><th>Statut</th></tr></thead>
                        <tbody>
                            {Object.values(kanbanColumns).flatMap(col => col.tasks).map((t, i) => (
                                <tr key={i} onClick={() => setSelectedTask(t)}>
                                    <td style={{ fontSize: '13px', fontWeight: 500, maxWidth: '200px' }}>{t.title}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.project}</td>
                                    <td>
                                        {t.assigneeInitials !== '?' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <div className="av" style={{ width: '22px', height: '22px', fontSize: '9px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>{t.assigneeInitials}</div>
                                                <span style={{ fontSize: '12px' }}>{t.assignee.split(' ')[0]}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td><span className={`pri-badge ${t.priority === 'Critique' ? 'pri-critical' : t.priority === 'Haute' ? 'pri-high' : t.priority === 'Moyenne' ? 'pri-medium' : 'pri-low'}`}>{t.priority}</span></td>
                                    <td><div className="pbar-wrap"><div className="pbar" style={{ minWidth: '60px' }}><div className="pfill" style={{ width: `${t.progress}%` }}></div></div><span className="ppct">{t.progress}%</span></div></td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{t.dueDate}</td>
                                    <td><span className={`badge ${t.status === 'done' ? 'b-green' : t.status === 'inprogress' ? 'b-blue' : t.status === 'todo' ? 'b-yellow' : 'b-gray'}`}>{t.status === 'done' ? 'Terminé' : t.status === 'inprogress' ? 'En cours' : t.status === 'todo' ? 'À faire' : 'Backlog'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
