'use client';

import { Bell, Search, Sun, Moon, Plus, LogOut } from 'lucide-react';
import type { AppRole, View } from '../lib/types';

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
  role: AppRole;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Topbar({ activeView, onNavigate, onLogout, role, theme, onToggleTheme }: TopbarProps) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="search-box">
          <Search size={13} color="var(--text-muted)" strokeWidth={2} />
          <input type="text" placeholder="Rechercher..." />
        </div>
        <div className="icon-btn notif-rel" onClick={() => onNavigate('notifications')} title="Notifications">
          <Bell size={15} strokeWidth={1.8} />
        </div>
        <div className="icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onNavigate(role === 'employee' ? 'taches' : 'projets')}
          disabled={role === 'employee'}
          title={role === 'employee' ? 'Reserved for admin/manager roles' : 'Create project'}
        >
          <Plus size={13} strokeWidth={2.5} />
          Nouveau
        </button>
        <div className="icon-btn" onClick={onLogout} title="Deconnexion">
          <LogOut size={15} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
