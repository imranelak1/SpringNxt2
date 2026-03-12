'use client';

type View = 'dashboard' | 'projets' | 'taches' | 'calendrier' | 'ressources' | 'rapports' | 'budgets' | 'performance' | 'notifications' | 'parametres' | 'utilisateurs' | 'import-pdf' | 'gantt';

interface SidebarProps {
    activeView: View;
    onNavigate: (view: View) => void;
    role?: 'admin' | 'pm' | 'employee';
}

const navSections = [
    {
        label: 'Général',
        items: [
            { view: 'dashboard' as View, icon: '⊞', label: 'Tableau de bord' },
            { view: 'projets' as View, icon: '📁', label: 'Projets', badge: '12', badgeCls: 'nbadge-blue' },
            { view: 'taches' as View, icon: '✓', label: 'Tâches', badge: '5', badgeCls: 'nbadge-red' },
            { view: 'gantt' as View, icon: '📊', label: 'Vue Gantt' },
            { view: 'calendrier' as View, icon: '📅', label: 'Calendrier' },
        ],
    },
    {
        label: 'Gestion',
        items: [
            { view: 'ressources' as View, icon: '👥', label: 'Ressources' },
            { view: 'budgets' as View, icon: '💰', label: 'Budgets' },
            { view: 'performance' as View, icon: '📈', label: 'Performance' },
        ],
    },
    {
        label: 'Intelligence',
        items: [
            { view: 'rapports' as View, icon: '✦', label: 'Rapports IA' },
            { view: 'import-pdf' as View, icon: '📄', label: 'Import PDF' },
        ],
    },
    {
        label: 'Administration',
        items: [
            { view: 'utilisateurs' as View, icon: '🛡', label: 'Utilisateurs' },
            { view: 'notifications' as View, icon: '🔔', label: 'Notifications', badge: '8', badgeCls: 'nbadge-red' },
            { view: 'parametres' as View, icon: '⚙', label: 'Paramètres' },
        ],
    },
];

export default function Sidebar({ activeView, onNavigate, role = 'pm' }: SidebarProps) {
    const roleLabel = { admin: '🛡 Administrateur', pm: '📋 Chef de Projet', employee: '👤 Employé' }[role];
    const roleBg = { admin: 'rgba(255,107,107,0.08)', pm: 'rgba(167,139,250,0.08)', employee: 'rgba(61,138,255,0.08)' }[role];
    const roleColor = { admin: 'var(--accent3)', pm: 'var(--accent5)', employee: 'var(--accent2)' }[role];

    return (
        <aside className="sidebar">
            <div className="logo">
                <div className="logo-mark">N</div>
                <div className="logo-text">NEX<span>US</span></div>
            </div>
            <div className="ws-sel">
                <div>
                    <div className="ws-label">Espace de travail</div>
                    <div className="ws-name">Agence Nexus</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>▾</span>
            </div>
            <nav className="nav">
                {navSections.map(section => (
                    <div className="nav-section" key={section.label}>
                        <div className="nav-lbl">{section.label}</div>
                        {section.items.map(item => (
                            <div
                                key={item.view}
                                className={`nav-item ${activeView === item.view ? 'active' : ''}`}
                                onClick={() => onNavigate(item.view)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                                {'badge' in item && item.badge && (
                                    <span className={`nbadge ${item.badgeCls}`}>{item.badge}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>SA</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="user-name">Sofia Amrani</div>
                    <div style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: roleBg, color: roleColor, display: 'inline-block', marginTop: '2px' }}>{roleLabel}</div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>↗</span>
            </div>
        </aside>
    );
}
