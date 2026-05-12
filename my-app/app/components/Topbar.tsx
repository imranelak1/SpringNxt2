'use client';

import { useMemo, useState } from 'react';
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
  simulation: 'Simulation',
  'archives-ia': 'Archives IA',
};

const searchItems: { view: View; label: string; group: string; keywords: string }[] = [
  { view: 'dashboard', label: 'Tableau de bord', group: 'General', keywords: 'dashboard accueil statistiques synthese' },
  { view: 'projets', label: 'Projets', group: 'General', keywords: 'portfolio projet planning client' },
  { view: 'taches', label: 'Taches', group: 'General', keywords: 'tasks kanban todo priorite' },
  { view: 'gantt', label: 'Vue Gantt', group: 'General', keywords: 'planning timeline calendrier' },
  { view: 'calendrier', label: 'Calendrier', group: 'General', keywords: 'date evenement meeting deadline' },
  { view: 'ressources', label: 'Ressources', group: 'Gestion', keywords: 'equipe allocation utilisateurs charge' },
  { view: 'budgets', label: 'Budgets', group: 'Gestion', keywords: 'cout finance depense montant' },
  { view: 'performance', label: 'Performance', group: 'Gestion', keywords: 'kpi livraison productivite' },
  { view: 'rapports', label: 'Rapports IA', group: 'Intelligence', keywords: 'analyse rapport intelligence' },
  { view: 'simulation', label: 'Project Studio', group: 'Intelligence', keywords: 'simulation generer projet ia' },
  { view: 'import-pdf', label: 'Import PDF', group: 'Intelligence', keywords: 'pdf document extraction' },
  { view: 'archives-ia', label: 'Archives IA', group: 'Intelligence', keywords: 'archive generation validee historique' },
  { view: 'utilisateurs', label: 'Utilisateurs', group: 'Administration', keywords: 'users membres roles admin' },
  { view: 'notifications', label: 'Notifications', group: 'Administration', keywords: 'alertes messages' },
  { view: 'parametres', label: 'Parametres', group: 'Administration', keywords: 'settings profil configuration' },
];

interface TopbarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  role: AppRole;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Topbar({ activeView, onNavigate, onLogout, role, theme, onToggleTheme }: TopbarProps) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const today = new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return searchItems
      .filter((item) => `${item.label} ${item.group} ${item.keywords}`.toLowerCase().includes(term))
      .slice(0, 6);
  }, [query]);

  const goToResult = (view: View) => {
    onNavigate(view);
    setQuery('');
    setSearchOpen(false);
  };

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
        <div className="global-search">
          <div className="search-box">
            <Search size={13} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) {
                  goToResult(results[0].view);
                }
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                }
              }}
            />
          </div>
          {searchOpen && query.trim() ? (
            <div className="search-results">
              {results.length === 0 ? (
                <div className="search-empty">Aucun resultat trouve</div>
              ) : (
                results.map((item) => (
                  <button
                    key={item.view}
                    className={`search-result-item${item.view === activeView ? ' active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToResult(item.view)}
                  >
                    <span className="search-result-label">{item.label}</span>
                    <span className="search-result-group">{item.group}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
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
