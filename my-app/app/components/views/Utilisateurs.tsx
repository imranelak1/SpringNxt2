'use client';
import { useState } from 'react';
import UserModal from '../UserModal';

interface User {
    id: number;
    name: string;
    initials: string;
    email: string;
    role: 'admin' | 'pm' | 'employee';
    status: 'active' | 'inactive';
    lastLogin: string;
    avatarGrad: string;
    projects: number;
}

const roleLabel: Record<string, string> = { admin: 'Administrateur', pm: 'Chef de Projet', employee: 'Employé' };
const roleBadge: Record<string, string> = { admin: 'b-red', pm: 'b-purple', employee: 'b-blue' };

const initialUsers: User[] = [
    { id: 1, name: 'Sofia Amrani', initials: 'SA', email: 'sofia@nexus.ma', role: 'admin', status: 'active', lastLogin: 'Auj. 10:32', avatarGrad: 'linear-gradient(135deg,#667eea,#764ba2)', projects: 5 },
    { id: 2, name: 'Karima Tahiri', initials: 'KT', email: 'karima@nexus.ma', role: 'pm', status: 'active', lastLogin: 'Auj. 09:14', avatarGrad: 'linear-gradient(135deg,#f093fb,#f5576c)', projects: 3 },
    { id: 3, name: 'Hassan Benjelloun', initials: 'HB', email: 'hassan@nexus.ma', role: 'employee', status: 'active', lastLogin: 'Hier 18:22', avatarGrad: 'linear-gradient(135deg,#43e97b,#38f9d7)', projects: 2 },
    { id: 4, name: 'Youssef El Amrani', initials: 'YE', email: 'youssef@nexus.ma', role: 'employee', status: 'active', lastLogin: 'Hier 16:07', avatarGrad: 'linear-gradient(135deg,#fa709a,#fee140)', projects: 2 },
    { id: 5, name: 'Nadia Alami', initials: 'NA', email: 'nadia@nexus.ma', role: 'employee', status: 'active', lastLogin: 'Mar 02 Mar', avatarGrad: 'linear-gradient(135deg,#fccb90,#d57eeb)', projects: 1 },
    { id: 6, name: 'Imrane Khalifa', initials: 'IK', email: 'imrane@nexus.ma', role: 'pm', status: 'inactive', lastLogin: 'Il y a 12j', avatarGrad: 'linear-gradient(135deg,#4facfe,#00f2fe)', projects: 0 },
];

const activityLog = [
    { user: 'Sofia Amrani', action: 'a créé le projet "Portail RH"', time: 'Il y a 5 min' },
    { user: 'Hassan Benjelloun', action: 's\'est connecté', time: 'Il y a 1h' },
    { user: 'Sofia Amrani', action: 'a modifié les droits de Nadia Alami', time: 'Hier 14:30' },
    { user: 'Karima Tahiri', action: 'a invité un nouvel utilisateur', time: 'Hier 10:12' },
    { user: 'Système', action: 'Tentative de connexion échouée (×3) — imrane@nexus.ma', time: '2 Mar 22:05' },
];

export default function Utilisateurs() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [showModal, setShowModal] = useState(false);
    const [filterRole, setFilterRole] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = users.filter(u => {
        const roleOk = filterRole === 'all' || u.role === filterRole;
        const searchOk = search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        return roleOk && searchOk;
    });

    const toggleStatus = (id: number) => {
        setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    };

    return (
        <div>
            {showModal && <UserModal onClose={() => setShowModal(false)} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Gestion des utilisateurs</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{users.filter(u => u.status === 'active').length} actifs · {users.length} total</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>＋ Inviter un utilisateur</button>
            </div>

            {/* Stats */}
            <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <div className="stat-card sc1"><div className="stat-lbl">Admins</div><div className="stat-val">{users.filter(u => u.role === 'admin').length}</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Chefs de projet</div><div className="stat-val">{users.filter(u => u.role === 'pm').length}</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Employés</div><div className="stat-val">{users.filter(u => u.role === 'employee').length}</div></div>
            </div>

            <div className="grid-lr">
                <div>
                    {/* Filter bar */}
                    <div className="filter-bar">
                        <div className="filter-search">
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>⌕</span>
                            <input placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                            <option value="all">Tous les rôles</option>
                            <option value="admin">Administrateurs</option>
                            <option value="pm">Chefs de projet</option>
                            <option value="employee">Employés</option>
                        </select>
                    </div>

                    <div className="card">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Rôle</th>
                                    <th>Projets</th>
                                    <th>Dernière connexion</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="av" style={{ background: u.avatarGrad }}>{u.initials}</div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${roleBadge[u.role]}`}>{roleLabel[u.role]}</span></td>
                                        <td><span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{u.projects}</span></td>
                                        <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.lastLogin}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className={`user-status-dot ${u.status === 'active' ? 'us-active' : 'us-inactive'}`}></span>
                                                <span style={{ fontSize: '12px' }}>{u.status === 'active' ? 'Actif' : 'Inactif'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="action-btn">✏ Modifier</button>
                                                <button className={`action-btn ${u.status === 'active' ? 'action-btn-danger' : ''}`} onClick={() => toggleStatus(u.id)}>
                                                    {u.status === 'active' ? '🔒 Désactiver' : '🔓 Activer'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity log */}
                <div className="col-stack">
                    <div className="card">
                        <div className="card-header"><div className="card-title">Journal d'activité</div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Temps réel</span></div>
                        {activityLog.map((a, i) => (
                            <div key={i} className="tl-item">
                                <div className="tl-dot" style={{ background: a.user === 'Système' ? 'var(--accent3)' : 'var(--accent2)' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="tl-title"><strong>{a.user}</strong> {a.action}</div>
                                </div>
                                <div className="tl-time">{a.time}</div>
                            </div>
                        ))}
                    </div>
                    <div className="ai-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Analyse RBAC</span></div>
                        <div className="ai-insight"><span className="insight-ico">🛡</span><div className="insight-txt">1 tentative de connexion échouée détectée. Compte Imrane K. en surveillance.</div></div>
                        <div className="ai-insight"><span className="insight-ico">📊</span><div className="insight-txt">Karima Tahiri est à 138% de charge. Suggère redistribution avant ajout de tâches.</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
