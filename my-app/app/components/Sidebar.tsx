'use client';

import { useState } from 'react';
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
  FlaskConical,
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
      { view: 'dashboard' as View, icon: LayoutDashboard, label: 'Tableau de bord' },
      { view: 'projets' as View, icon: FolderKanban, label: 'Projets' },
      { view: 'taches' as View, icon: ListChecks, label: 'Taches' },
      { view: 'gantt' as View, icon: GanttChart, label: 'Vue Gantt' },
      { view: 'calendrier' as View, icon: Calendar, label: 'Calendrier' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { view: 'ressources' as View, icon: Users, label: 'Ressources' },
      { view: 'budgets' as View, icon: Wallet, label: 'Budgets' },
      { view: 'performance' as View, icon: TrendingUp, label: 'Performance' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { view: 'rapports' as View, icon: Sparkles, label: 'Rapports IA' },
      { view: 'simulation' as View, icon: FlaskConical, label: 'Project Studio' },
      { view: 'import-pdf' as View, icon: FileUp, label: 'Import PDF' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { view: 'utilisateurs' as View, icon: ShieldCheck, label: 'Utilisateurs' },
      { view: 'notifications' as View, icon: Bell, label: 'Notifications' },
      { view: 'parametres' as View, icon: Settings, label: 'Parametres' },
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

export default function Sidebar({ activeView, onNavigate, onLogout, role, email, firstName, lastName }: SidebarProps) {
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email;
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : getInitials(email);

  // Open the section that contains the active view; close the rest by default
  const initialOpen = () => {
    const obj: Record<string, boolean> = {};
    navSections.forEach((s) => {
      obj[s.label] = s.items.some((i) => i.view === activeView);
    });
    // Ensure at least General is open on first load
    if (!Object.values(obj).some(Boolean)) obj['General'] = true;
    return obj;
  };
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  const toggle = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  // Auto-open section when navigating to one of its views
  const handleNavigate = (view: View) => {
    const section = navSections.find((s) => s.items.some((i) => i.view === view));
    if (section && !open[section.label]) {
      setOpen((prev) => ({ ...prev, [section.label]: true }));
    }
    onNavigate(view);
  };

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
        {navSections.map((section) => {
          const isOpen = open[section.label] ?? false;
          return (
            <div className="nav-section" key={section.label} style={{ marginBottom: '4px' }}>
              {/* Clickable section header */}
              <div
                className="nav-section-header"
                onClick={() => toggle(section.label)}
              >
                <span className="nav-lbl" style={{ margin: 0 }}>{section.label}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2.5}
                  style={{
                    color: 'var(--text-muted)',
                    transition: 'transform 0.22s ease',
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Collapsible items */}
              <div className={`nav-section-items${isOpen ? ' open' : ''}`}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.view}
                      className={`nav-item ${activeView === item.view ? 'active' : ''}`}
                      onClick={() => handleNavigate(item.view)}
                    >
                      <Icon size={15} strokeWidth={1.8} className="nav-icon-svg" />
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
