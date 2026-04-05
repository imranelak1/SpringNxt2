'use client';

import type { AppRole, View } from '../lib/types';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  role: AppRole;
  email: string;
}

const navSections = [
  {
    label: 'General',
    items: [
      { view: 'dashboard' as View, icon: '\u229E', label: 'Tableau de bord' },
      { view: 'projets' as View, icon: '\u{1F4C1}', label: 'Projets' },
      { view: 'taches' as View, icon: '\u2713', label: 'Taches' },
      { view: 'gantt' as View, icon: '\u{1F4CA}', label: 'Vue Gantt' },
      { view: 'calendrier' as View, icon: '\u{1F4C5}', label: 'Calendrier' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { view: 'ressources' as View, icon: '\u{1F465}', label: 'Ressources' },
      { view: 'budgets' as View, icon: '\u{1F4B0}', label: 'Budgets' },
      { view: 'performance' as View, icon: '\u{1F4C8}', label: 'Performance' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { view: 'rapports' as View, icon: '\u2726', label: 'Rapports IA' },
      { view: 'import-pdf' as View, icon: '\u{1F4C4}', label: 'Import PDF' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { view: 'utilisateurs' as View, icon: '\u{1F6E1}', label: 'Utilisateurs' },
      { view: 'notifications' as View, icon: '\u{1F514}', label: 'Notifications' },
      { view: 'parametres' as View, icon: '\u2699', label: 'Parametres' },
    ],
  },
];

function getRoleLabel(role: AppRole) {
  if (role === 'admin') {
    return 'Administrateur';
  }

  if (role === 'pm') {
    return 'Chef de Projet';
  }

  return 'Employe';
}

function getInitials(email: string) {
  return email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Sidebar({ activeView, onNavigate, role, email }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">N</div>
        <div className="logo-text">
          NEX<span>US</span>
        </div>
      </div>
      <div className="ws-sel">
        <div>
          <div className="ws-label">Espace de travail</div>
          <div className="ws-name">Agence Nexus</div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>&#9662;</span>
      </div>
      <nav className="nav">
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <div className="nav-lbl">{section.label}</div>
            {section.items.map((item) => (
              <div
                key={item.view}
                className={`nav-item ${activeView === item.view ? 'active' : ''}`}
                onClick={() => onNavigate(item.view)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
          {getInitials(email)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{email}</div>
          <div
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              background:
                role === 'admin'
                  ? 'rgba(255,107,107,0.08)'
                  : role === 'pm'
                    ? 'rgba(167,139,250,0.08)'
                    : 'rgba(61,138,255,0.08)',
              color:
                role === 'admin'
                  ? 'var(--accent3)'
                  : role === 'pm'
                    ? 'var(--accent5)'
                    : 'var(--accent2)',
              display: 'inline-block',
              marginTop: '2px',
            }}
          >
            {getRoleLabel(role)}
          </div>
        </div>
      </div>
    </aside>
  );
}
