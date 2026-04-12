'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/views/Dashboard';
import Projets from './components/views/Projets';
import Taches from './components/views/Taches';
import Calendrier from './components/views/Calendrier';
import Ressources from './components/views/Ressources';
import Rapports from './components/views/Rapports';
import Budgets from './components/views/Budgets';
import Performance from './components/views/Performance';
import Notifications from './components/views/Notifications';
import Parametres from './components/views/Parametres';
import Utilisateurs from './components/views/Utilisateurs';
import PdfImport from './components/views/PdfImport';
import GanttView from './components/views/GanttView';
import type { AuthSession, View } from './lib/types';

const SESSION_STORAGE_KEY = 'springnxt-session';
const THEME_STORAGE_KEY = 'springnxt-theme';

const defaultViewsByRole: Record<AuthSession['role'], View> = {
  admin: 'dashboard',
  pm: 'dashboard',
  employee: 'dashboard',
};

export default function Home() {
  const storedSessionSnapshot = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);
      return () => window.removeEventListener('storage', onStoreChange);
    },
    () => window.localStorage.getItem(SESSION_STORAGE_KEY),
    () => null,
  );
  const storedSession = useMemo(() => {
    if (!storedSessionSnapshot) {
      return null;
    }

    try {
      return JSON.parse(storedSessionSnapshot) as AuthSession;
    } catch {
      return null;
    }
  }, [storedSessionSnapshot]);
  const [sessionOverride, setSessionOverride] = useState<AuthSession | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' ? 'light' : 'dark';
  });
  const session = sessionOverride ?? storedSession;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleLogin = (nextSession: AuthSession) => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSessionOverride(nextSession);
    setActiveView(defaultViewsByRole[nextSession.role]);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionOverride(null);
    setActiveView('dashboard');
  };

  const handleToggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const views: Record<View, React.ReactNode> = {
    dashboard: (
      <Dashboard onNavigate={setActiveView} token={session.token} role={session.role} />
    ),
    projets: <Projets token={session.token} role={session.role} />,
    taches: <Taches token={session.token} role={session.role} />,
    calendrier: <Calendrier token={session.token} role={session.role} />,
    ressources: <Ressources token={session.token} role={session.role} />,
    rapports: <Rapports />,
    budgets: <Budgets />,
    performance: <Performance />,
    notifications: <Notifications />,
    parametres: <Parametres email={session.email} role={session.role} firstName={session.firstName ?? ''} lastName={session.lastName ?? ''} />,
    utilisateurs: <Utilisateurs token={session.token} />,
    'import-pdf': <PdfImport token={session.token} />,
    gantt: <GanttView token={session.token} role={session.role} />,
  };

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
        role={session.role}
        email={session.email}
        firstName={session.firstName ?? ''}
        lastName={session.lastName ?? ''}
      />
      <main className="main">
        <Topbar
          activeView={activeView}
          onNavigate={setActiveView}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <div className="content">
          {(Object.keys(views) as View[]).map((view) => (
            <div key={view} className={`view ${activeView === view ? 'active' : ''}`}>
              {views[view]}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
