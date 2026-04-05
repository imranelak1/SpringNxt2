'use client';

import type { View } from '../lib/types';

const titles: Record<View, string> = {
  dashboard: 'Tableau de bord',
  projets: 'Projets',
  taches: 'Taches',
  calendrier: 'Calendar',
  ressources: 'Resources',
  rapports: 'Rapports IA',
  budgets: 'Budgets',
  performance: 'Performance',
  notifications: 'Notifications',
  parametres: 'Parametres',
  utilisateurs: 'Utilisateurs',
  'import-pdf': 'PDF Import',
  gantt: 'Vue Gantt',
};

interface TopbarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Topbar({ activeView, onNavigate, onLogout, theme, onToggleTheme }: TopbarProps) {
  const today = new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="topbar">
      <div className="page-title">{titles[activeView]}</div>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          background: 'var(--surface2)',
          padding: '3px 9px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
        }}
      >
        {today}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="search-box">
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>&#8981;</span>
          <input type="text" placeholder="Rechercher..." />
        </div>
        <div className="icon-btn notif-rel" onClick={() => onNavigate('notifications')}>
          &#128276;
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('projets')}>
          + Nouveau
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>
          Deconnexion
        </button>
      </div>
    </div>
  );
}
