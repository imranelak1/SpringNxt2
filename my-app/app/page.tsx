'use client';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginPage from './components/LoginPage';
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

type View = 'dashboard' | 'projets' | 'taches' | 'calendrier' | 'ressources' | 'rapports' | 'budgets' | 'performance' | 'notifications' | 'parametres' | 'utilisateurs' | 'import-pdf' | 'gantt';
type Role = 'admin' | 'pm' | 'employee';

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

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>('pm');
  const [activeView, setActiveView] = useState<View>('dashboard');

  const handleLogin = (r: Role) => {
    setRole(r);
    setIsLoggedIn(true);
    // Role-based default view
    if (r === 'employee') setActiveView('dashboard');
    else if (r === 'admin') setActiveView('utilisateurs');
    else setActiveView('dashboard');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const views: Record<View, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={setActiveView} />,
    projets: <Projets />,
    taches: <Taches />,
    calendrier: <Calendrier />,
    ressources: <Ressources />,
    rapports: <Rapports />,
    budgets: <Budgets />,
    performance: <Performance />,
    notifications: <Notifications />,
    parametres: <Parametres />,
    utilisateurs: <Utilisateurs />,
    'import-pdf': <PdfImport />,
    gantt: <GanttView />,
  };

  return (
    <div className="app">
      <Sidebar activeView={activeView} onNavigate={setActiveView} role={role} />
      <main className="main">
        <Topbar activeView={activeView} onNavigate={setActiveView} />
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
