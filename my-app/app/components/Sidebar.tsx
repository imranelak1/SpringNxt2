'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  GanttChart,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  Sparkles,
  FileUp,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { AppRole, View } from '../lib/types';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  role: AppRole;
  email: string;
  firstName: string;
  lastName: string;
}

const navSections = [
  {
    label: 'General',
    items: [
      { view: 'dashboard' as View, icon: LayoutDashboard, label: 'Tableau de bord', essentialIcon: true },
      { view: 'projets' as View, icon: FolderKanban, label: 'Projets', essentialIcon: false },
      { view: 'taches' as View, icon: ListChecks, label: 'Taches', essentialIcon: true },
      { view: 'gantt' as View, icon: GanttChart, label: 'Vue Gantt', essentialIcon: false },
      { view: 'calendrier' as View, icon: Calendar, label: 'Calendrier', essentialIcon: true },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { view: 'ressources' as View, icon: Users, label: 'Ressources', essentialIcon: true },
      { view: 'budgets' as View, icon: Wallet, label: 'Budgets', essentialIcon: false },
      { view: 'performance' as View, icon: TrendingUp, label: 'Performance', essentialIcon: false },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { view: 'rapports' as View, icon: Sparkles, label: 'Rapports IA', essentialIcon: false },
      { view: 'import-pdf' as View, icon: FileUp, label: 'Import PDF', essentialIcon: false },
    ],
  },
  {
    label: 'Administration',
    items: [
      { view: 'utilisateurs' as View, icon: ShieldCheck, label: 'Utilisateurs', essentialIcon: true },
      { view: 'notifications' as View, icon: Bell, label: 'Notifications', essentialIcon: false },
      { view: 'parametres' as View, icon: Settings, label: 'Parametres', essentialIcon: false },
    ],
  },
];

function getRoleLabel(role: AppRole) {
  if (role === 'admin') return 'Administrateur';
  if (role === 'pm') return 'Chef de Projet';
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

function canAccessView(role: AppRole, view: View) {
  if (role === 'employee') {
    return !['projets', 'ressources', 'utilisateurs', 'gantt'].includes(view);
  }

  return true;
}

export default function Sidebar({ activeView, onNavigate, onLogout, role, email, firstName, lastName }: SidebarProps) {
  const visibleSections = useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => canAccessView(role, item.view)),
        }))
        .filter((section) => section.items.length > 0),
    [role],
  );
  const activeSectionLabel =
    visibleSections.find((section) => section.items.some((item) => item.view === activeView))?.label ??
    visibleSections[0]?.label ??
    '';
  const [openSection, setOpenSection] = useState(activeSectionLabel);
  useEffect(() => {
    setOpenSection(activeSectionLabel);
  }, [activeSectionLabel]);

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email;
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : getInitials(email);

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
        {visibleSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <button
              className="nav-lbl nav-section-toggle"
              onClick={() => setOpenSection((current) => (current === section.label ? '' : section.label))}
            >
              <span>{section.label}</span>
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={`nav-chevron ${openSection === section.label ? 'open' : ''}`}
              />
            </button>
            <div className={`nav-items ${openSection === section.label ? 'open' : ''}`}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.view}
                    className={`nav-item ${activeView === item.view ? 'active' : ''}`}
                    onClick={() => onNavigate(item.view)}
                  >
                    {item.essentialIcon ? (
                      <Icon size={13} strokeWidth={1.7} className="nav-icon-svg" />
                    ) : (
                      <span className="nav-icon-placeholder" aria-hidden="true"></span>
                    )}
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{displayName}</div>
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
        <button
          onClick={onLogout}
          title="Se déconnecter"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '7px',
            flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent3)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}
        >
          <LogOut size={15} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
