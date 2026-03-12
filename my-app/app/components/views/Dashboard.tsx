'use client';
import { useState } from 'react';

type View = 'dashboard' | 'projets' | 'taches' | 'calendrier' | 'ressources' | 'rapports' | 'budgets' | 'performance' | 'notifications' | 'parametres' | 'utilisateurs' | 'import-pdf' | 'gantt';
type DashMode = 'pm' | 'admin' | 'employee';

interface DashboardProps {
    onNavigate: (view: View) => void;
}

function HealthScoreRing({ score }: { score: number }) {
    const color = score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--accent4)' : score >= 40 ? 'var(--accent3)' : '#ff3333';
    const label = score >= 80 ? 'Bon' : score >= 60 ? 'Attention' : score >= 40 ? 'Risque' : 'Critique';
    return (
        <div className="health-score-ring">
            <div className="health-score-ring-bg" style={{ background: `conic-gradient(${color} ${score}%, var(--surface2) 0)` }}></div>
            <div className="health-score-inner">
                <div className="health-score-val" style={{ color }}>{score}</div>
                <div className="health-score-lbl">{label}</div>
            </div>
        </div>
    );
}

function PMDashboard({ onNavigate }: DashboardProps) {
    return (
        <div>
            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card sc1"><div className="stat-lbl">Projets actifs</div><div className="stat-val">12</div><div className="stat-chg up">↑ +3 ce mois</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Tâches en cours</div><div className="stat-val">84</div><div className="stat-chg up">↑ +12% semaine</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Budget utilisé</div><div className="stat-val">68%</div><div className="stat-chg down">↓ −5% vs objectif</div></div>
                <div className="stat-card sc4"><div className="stat-lbl">Délais manqués</div><div className="stat-val">3</div><div className="stat-chg down">⚠ Attention requise</div></div>
            </div>

            {/* Health Scores row */}
            <div className="grid-3 mb18">
                {[
                    { name: 'Refonte Site Web', score: 82, factors: [{ n: 'Respect délais (40%)', v: '88%' }, { n: 'Avancement tâches (35%)', v: '72%' }, { n: 'Charge équipe (15%)', v: '75%' }, { n: 'Budget (10%)', v: '68%' }] },
                    { name: 'Application Mobile', score: 47, factors: [{ n: 'Respect délais (40%)', v: '38%' }, { n: 'Avancement tâches (35%)', v: '89%' }, { n: 'Charge équipe (15%)', v: '45%' }, { n: 'Budget (10%)', v: '6%' }] },
                    { name: 'Campagne Q2', score: 74, factors: [{ n: 'Respect délais (40%)', v: '80%' }, { n: 'Avancement tâches (35%)', v: '34%' }, { n: 'Charge équipe (15%)', v: '90%' }, { n: 'Budget (10%)', v: '66%' }] },
                ].map(({ name, score, factors }) => (
                    <div key={name} className="health-score-widget">
                        <HealthScoreRing score={score} />
                        <div className="health-score-details">
                            <div className="health-score-title">{name}</div>
                            {factors.slice(0, 3).map(f => (
                                <div key={f.n} className="health-factor">
                                    <div className="health-factor-name">{f.n}</div>
                                    <div className="pbar" style={{ flex: 1, height: '4px' }}>
                                        <div className="pfill" style={{ width: f.v, background: parseInt(f.v) >= 70 ? 'var(--accent)' : parseInt(f.v) >= 50 ? 'var(--accent4)' : 'var(--accent3)' }}></div>
                                    </div>
                                    <div className="health-factor-pct">{f.v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Delay Prediction + Activity */}
            <div className="grid-lr mb18">
                <div className="col-stack">
                    {/* Delay prediction */}
                    <div className="delay-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '16px' }}>🔮</span>
                            <span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '13px', fontWeight: 600 }}>Prédiction de délais — IA</span>
                            <span className="badge b-red" style={{ marginLeft: 'auto' }}>3 à risque</span>
                        </div>
                        <div className="delay-item">
                            <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 500 }}>Application Mobile</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bloqueur : API Stripe non finalisée · 3 tâches critiques non assignées</div></div>
                            <span className="delay-risk risk-high">Risque Élevé</span>
                            <span style={{ fontSize: '11px', color: 'var(--accent3)', whiteSpace: 'nowrap' }}>15 Mar ⚠</span>
                        </div>
                        <div className="delay-item">
                            <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 500 }}>Design System</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>En pause depuis 3 semaines · Aucune activité récente</div></div>
                            <span className="delay-risk risk-medium">Risque Moyen</span>
                            <span style={{ fontSize: '11px', color: 'var(--accent4)', whiteSpace: 'nowrap' }}>Indéfinie</span>
                        </div>
                        <div className="delay-item">
                            <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 500 }}>Campagne Q2</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avancement 34% pour 35% du temps écoulé · Tendance stable</div></div>
                            <span className="delay-risk risk-low">Faible</span>
                            <span style={{ fontSize: '11px', color: 'var(--accent)', whiteSpace: 'nowrap' }}>12 Avr</span>
                        </div>
                    </div>

                    {/* Projects table */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Projets en cours</div>
                            <button className="btn btn-ghost btn-sm">Filtrer ▾</button>
                            <span className="card-action" onClick={() => onNavigate('projets')}>Voir tout →</span>
                        </div>
                        <table className="tbl">
                            <thead><tr><th>Projet</th><th>Santé</th><th>Avancement</th><th>Échéance</th></tr></thead>
                            <tbody>
                                {[
                                    { icon: '🌐', name: 'Refonte Site Web', client: 'TechCorp', score: 82, prog: 72, due: '28 Mar', dueColor: '' },
                                    { icon: '📱', name: 'Application Mobile', client: 'StartupX', score: 47, prog: 89, due: '15 Mar ⚠', dueColor: 'var(--accent3)' },
                                    { icon: '📣', name: 'Campagne Q2', client: 'BrandMax', score: 74, prog: 34, due: '12 Avr', dueColor: '' },
                                ].map(p => {
                                    const sc = p.score >= 80 ? 'var(--accent)' : p.score >= 60 ? 'var(--accent4)' : 'var(--accent3)';
                                    return (
                                        <tr key={p.name}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '16px' }}>{p.icon}</span><div><div style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.client}</div></div></div></td>
                                            <td><span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '15px', fontWeight: 700, color: sc }}>{p.score}</span></td>
                                            <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: `${p.prog}%` }}></div></div><span className="ppct">{p.prog}%</span></div></td>
                                            <td style={{ fontSize: '12.5px', color: p.dueColor || 'var(--text-dim)' }}>{p.due}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right col */}
                <div className="col-stack">
                    <div className="ai-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Insights Intelligents</span></div>
                        <div className="ai-insight"><span className="insight-ico">⚡</span><div className="insight-txt"><strong>Risque délai :</strong> App Mobile (15 Mar) — 3 tâches critiques non assignées.</div></div>
                        <div className="ai-insight"><span className="insight-ico">👥</span><div className="insight-txt"><strong>Surcharge :</strong> Karima Tahiri à 138%. Suggère déplacer 2 tâches vers Youssef El.</div></div>
                        <div className="ai-insight"><span className="insight-ico">💰</span><div className="insight-txt"><strong>Budget Campagne Q2</strong> risque +8% dépassement. Revoyez avant mi-mars.</div></div>
                    </div>
                    <div className="card">
                        <div className="card-header"><div className="card-title">Activité récente</div></div>
                        <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent)' }}></div><div style={{ flex: 1 }}><div className="tl-title">Maquette V3 soumise</div><div className="tl-sub">Refonte Site Web · Karima</div></div><div className="tl-time">10 min</div></div>
                        <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent2)' }}></div><div style={{ flex: 1 }}><div className="tl-title">Sprint #8 terminé</div><div className="tl-sub">Application Mobile · Hassan</div></div><div className="tl-time">1h</div></div>
                        <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent4)' }}></div><div style={{ flex: 1 }}><div className="tl-title">Budget révisé (+12k MAD)</div><div className="tl-sub">Campagne Q2 · Sofia</div></div><div className="tl-time">3h</div></div>
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><div className="card-title">Tâches urgentes</div><span className="card-action" onClick={() => onNavigate('taches')}>Voir tout →</span></div>
                    <div style={{ padding: '12px' }}>
                        <div className="task-card"><span className="task-tag tt-dev">Dev</span><div className="task-title">API paiement — intégration Stripe</div><div className="task-footer"><span className="task-due" style={{ color: 'var(--accent3)' }}>⚠ 8 Mar</span><div className="av" style={{ width: '22px', height: '22px', fontSize: '9px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>HB</div><span className="pri-badge pri-critical">Critique</span></div></div>
                        <div className="task-card"><span className="task-tag tt-des">Design</span><div className="task-title">Wireframes page d'accueil v2</div><div className="task-footer"><span className="task-due">📅 10 Mar</span><div className="av" style={{ width: '22px', height: '22px', fontSize: '9px', background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>KT</div><span className="pri-badge pri-medium">Moyenne</span></div></div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><div className="card-title">Charge équipe</div><span className="card-action" onClick={() => onNavigate('ressources')}>Gérer →</span></div>
                    <div className="res-row"><div className="av" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>KT</div><div style={{ flex: 1 }}><div className="res-name">Karima Tahiri</div><div className="res-role">UX/UI Design</div></div><div className="mini-bar"><div className="mini-fill" style={{ width: '100%', background: 'var(--accent3)' }}></div></div><span className="res-load rl-hi">138%</span></div>
                    <div className="res-row"><div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>SA</div><div style={{ flex: 1 }}><div className="res-name">Sofia Amrani</div><div className="res-role">Chef de Projet</div></div><div className="mini-bar"><div className="mini-fill" style={{ width: '85%', background: 'var(--accent4)' }}></div></div><span className="res-load rl-md">85%</span></div>
                    <div className="res-row"><div className="av" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>HB</div><div style={{ flex: 1 }}><div className="res-name">Hassan Benjelloun</div><div className="res-role">Dev Frontend</div></div><div className="mini-bar"><div className="mini-fill" style={{ width: '60%' }}></div></div><span className="res-load rl-lo">60%</span></div>
                </div>
            </div>
        </div>
    );
}

function AdminDashboard({ onNavigate }: DashboardProps) {
    return (
        <div>
            <div className="stats-row">
                <div className="stat-card sc1"><div className="stat-lbl">Utilisateurs actifs</div><div className="stat-val">5</div><div className="stat-chg up">↑ 1 cette semaine</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Projets total</div><div className="stat-val">12</div><div className="stat-chg up">5 en cours</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Temps de réponse</div><div className="stat-val">98ms</div><div className="stat-chg up">↑ Optimal</div></div>
                <div className="stat-card sc4"><div className="stat-lbl">Alertes système</div><div className="stat-val">1</div><div className="stat-chg down">⚠ Tentative login</div></div>
            </div>
            <div className="grid-2 mb18">
                <div className="card">
                    <div className="card-header"><div className="card-title">Répartition des rôles</div><span className="card-action" onClick={() => onNavigate('utilisateurs')}>Gérer →</span></div>
                    <div style={{ padding: '16px 20px' }}>
                        {[{ label: '🛡 Administrateurs', count: 1, total: 6, color: 'var(--accent3)' }, { label: '📋 Chefs de projet', count: 2, total: 6, color: 'var(--accent5)' }, { label: '👤 Employés', count: 3, total: 6, color: 'var(--accent2)' }].map(r => (
                            <div key={r.label} className="bud-row">
                                <div className="bud-label">{r.label}</div>
                                <div className="bud-bar"><div className="bud-fill" style={{ width: `${(r.count / r.total) * 100}%`, background: r.color }}></div></div>
                                <div className="bud-val" style={{ color: r.color }}>{r.count} / {r.total}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><div className="card-title">Santé de la plateforme</div></div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[{ label: 'API Backend', status: '✅ Opérationnel', ping: '42ms' }, { label: 'Base de données', status: '✅ Opérationnel', ping: '8ms' }, { label: 'Authentification JWT', status: '✅ Valide', ping: '—' }, { label: 'Service email', status: '✅ Actif', ping: '—' }].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--surface2)', borderRadius: '7px' }}>
                                <div style={{ flex: 1, fontSize: '13px' }}>{s.label}</div>
                                <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{s.status}</span>
                                {s.ping !== '—' && <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)' }}>{s.ping}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-header"><div className="card-title">Journal d'activité système</div></div>
                {[
                    { dot: 'var(--accent)', txt: 'Sofia Amrani — Connecting depuis 185.xx.xx.xx (Casablanca)', time: 'Auj. 10:32' },
                    { dot: 'var(--accent2)', txt: 'Hassan Benjelloun — Mise à jour tâche "API Stripe"', time: 'Auj. 09:14' },
                    { dot: 'var(--accent3)', txt: '⚠ ALERTE — 3 tentatives de connexion échouées pour imrane@nexus.ma', time: '2 Mar 22:05' },
                    { dot: 'var(--accent4)', txt: 'Rapport mensuel Fév 2025 généré automatiquement par IA', time: '1 Mar 08:00' },
                ].map((a, i) => (
                    <div key={i} className="tl-item"><div className="tl-dot" style={{ background: a.dot }}></div><div style={{ flex: 1 }}><div className="tl-title">{a.txt}</div></div><div className="tl-time">{a.time}</div></div>
                ))}
            </div>
        </div>
    );
}

function EmployeeDashboard({ onNavigate }: DashboardProps) {
    const [checked, setChecked] = useState<number[]>([2]);
    const toggleCheck = (i: number) => setChecked(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);

    const myTasks = [
        { title: 'Intégration API paiement Stripe', project: 'Application Mobile', due: '8 Mar', priority: 'Critique', priBadge: 'pri-critical' },
        { title: 'Géolocalisation temps réel', project: 'Application Mobile', due: '14 Mar', priority: 'Haute', priBadge: 'pri-high' },
        { title: 'CI/CD pipeline GitHub Actions', project: 'Application Mobile', due: '12 Mar', priority: 'Moyenne', priBadge: 'pri-medium' },
        { title: 'Tests unitaires module auth', project: 'Refonte Site Web', due: 'Terminé ✓', priority: 'Faible', priBadge: 'pri-low' },
    ];

    const done = checked.length;
    const pct = Math.round((done / myTasks.length) * 100);

    return (
        <div>
            <div className="stats-row">
                <div className="stat-card sc1"><div className="stat-lbl">Mes tâches actives</div><div className="stat-val">3</div><div className="stat-chg">Sprint 9 en cours</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Charge actuelle</div><div className="stat-val">60%</div><div className="stat-chg up">↑ Dans les limites</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Tâches complétées</div><div className="stat-val">24</div><div className="stat-chg up">Ce mois · 96% à temps</div></div>
                <div className="stat-card sc4"><div className="stat-lbl">Prochain délai</div><div className="stat-val" style={{ fontSize: '20px' }}>8 Mar</div><div className="stat-chg down">⚠ Dans 4 jours</div></div>
            </div>

            <div className="grid-lr">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Mes tâches — Sprint 9</div>
                        <div className="pbar-wrap" style={{ flex: 1, marginLeft: '10px' }}>
                            <div className="pbar"><div className="pfill" style={{ width: `${pct}%` }}></div></div>
                            <span className="ppct">{pct}%</span>
                        </div>
                        <span className="card-action" onClick={() => onNavigate('taches')}>Tout voir →</span>
                    </div>
                    {myTasks.map((t, i) => (
                        <div key={i} className="my-task-item" onClick={() => toggleCheck(i)}>
                            <div className={`my-task-check ${checked.includes(i) ? 'done' : ''}`}>
                                {checked.includes(i) && <span style={{ color: '#0a0c10', fontSize: '11px' }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, textDecoration: checked.includes(i) ? 'line-through' : 'none', opacity: checked.includes(i) ? 0.5 : 1 }}>{t.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📁 {t.project} · 📅 {t.due}</div>
                            </div>
                            <span className={`pri-badge ${t.priBadge}`}>{t.priority}</span>
                        </div>
                    ))}
                </div>

                <div className="col-stack">
                    <div className="card">
                        <div className="card-header"><div className="card-title">Mon score performance</div></div>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '48px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>A+</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>Février 2025 · 96% à temps</div>
                            <div className="pbar" style={{ height: '8px' }}><div className="pfill" style={{ width: '96%' }}></div></div>
                        </div>
                    </div>
                    <div className="ai-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Conseils personnalisés</span></div>
                        <div className="ai-insight"><span className="insight-ico">⚠</span><div className="insight-txt">Deadline <strong>API Stripe dans 4 jours</strong>. Priorisez cette tâche.</div></div>
                        <div className="ai-insight"><span className="insight-ico">💡</span><div className="insight-txt">Votre productivité de 60% vous laisse <strong>16h disponibles</strong> cette semaine.</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const [mode, setMode] = useState<DashMode>('pm');

    return (
        <div>
            <div className="dash-mode-bar">
                <button className={`dash-mode-btn ${mode === 'pm' ? 'active' : ''}`} onClick={() => setMode('pm')}>📋 Chef de Projet</button>
                <button className={`dash-mode-btn ${mode === 'admin' ? 'active' : ''}`} onClick={() => setMode('admin')}>🛡 Admin</button>
                <button className={`dash-mode-btn ${mode === 'employee' ? 'active' : ''}`} onClick={() => setMode('employee')}>👤 Employé</button>
            </div>
            {mode === 'pm' && <PMDashboard onNavigate={onNavigate} />}
            {mode === 'admin' && <AdminDashboard onNavigate={onNavigate} />}
            {mode === 'employee' && <EmployeeDashboard onNavigate={onNavigate} />}
        </div>
    );
}
