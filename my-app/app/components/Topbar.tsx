'use client';

type View = 'dashboard' | 'projets' | 'taches' | 'calendrier' | 'ressources' | 'rapports' | 'budgets' | 'performance' | 'notifications' | 'parametres' | 'utilisateurs' | 'import-pdf' | 'gantt';

const titles: Record<View, string> = {
    dashboard: 'Tableau de bord',
    projets: 'Projets',
    taches: 'Tâches',
    calendrier: 'Calendrier',
    ressources: 'Ressources',
    rapports: 'Rapports IA',
    budgets: 'Budgets',
    performance: 'Performance',
    notifications: 'Notifications',
    parametres: 'Paramètres',
    utilisateurs: 'Utilisateurs',
    'import-pdf': 'Import PDF',
    gantt: 'Vue Gantt',
};

interface TopbarProps {
    activeView: View;
    onNavigate: (view: View) => void;
}

export default function Topbar({ activeView, onNavigate }: TopbarProps) {
    return (
        <div className="topbar">
            <div className="page-title">{titles[activeView]}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface2)', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                Mar 4 Mars 2025
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="search-box">
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>⌕</span>
                    <input type="text" placeholder="Rechercher..." />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface2)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>⌘K</span>
                </div>
                <div className="icon-btn notif-rel" onClick={() => onNavigate('notifications')}>🔔</div>
                <button className="btn btn-primary btn-sm" onClick={() => onNavigate('projets')}>＋ Nouveau</button>
            </div>
        </div>
    );
}
