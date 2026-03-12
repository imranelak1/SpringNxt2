'use client';
import { useState } from 'react';

export default function Notifications() {
    const [toggles, setToggles] = useState({
        delais: true, surcharge: true, commentaires: true,
        resume: true, budgets: true, email: false,
    });

    const toggle = (key: keyof typeof toggles) => setToggles(t => ({ ...t, [key]: !t[key] }));

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Notifications</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>8 non lues</div>
                </div>
                <button className="btn btn-ghost btn-sm">Tout marquer lu</button>
                <button className="btn btn-ghost btn-sm">Paramètres notifs ⚙</button>
            </div>

            <div className="grid-rl">
                <div className="col-stack">
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Non lues</div>
                    <div className="card">
                        <div className="notif-item unread">
                            <div className="notif-ico" style={{ background: 'rgba(255,107,107,0.1)' }}>⚠</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Délai critique — Application Mobile</div><div className="notif-desc">Livraison dans 11 jours. 3 tâches critiques toujours non assignées. Action requise.</div></div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}><div className="notif-time">10 min</div><div className="unread-dot"></div></div>
                        </div>
                        <div className="notif-item unread">
                            <div className="notif-ico" style={{ background: 'rgba(255,107,107,0.1)' }}>👥</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Surcharge détectée — Karima Tahiri</div><div className="notif-desc">Charge à 138% cette semaine. L'IA recommande de réaffecter 2 tâches à Youssef El Amrani.</div></div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}><div className="notif-time">1h</div><div className="unread-dot"></div></div>
                        </div>
                        <div className="notif-item unread">
                            <div className="notif-ico" style={{ background: 'rgba(255,203,71,0.1)' }}>💰</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Budget App Mobile dépassé</div><div className="notif-desc">Consommation à 108% (194 000 MAD / 180 000 MAD). Voir rapport budgétaire.</div></div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}><div className="notif-time">2h</div><div className="unread-dot"></div></div>
                        </div>
                        <div className="notif-item unread">
                            <div className="notif-ico" style={{ background: 'rgba(79,255,176,0.1)' }}>✅</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Sprint #8 terminé avec succès</div><div className="notif-desc">Hassan Benjelloun a clôturé le sprint avec 24/25 tâches complétées. Rapport disponible.</div></div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}><div className="notif-time">3h</div><div className="unread-dot"></div></div>
                        </div>
                        <div className="notif-item unread">
                            <div className="notif-ico" style={{ background: 'rgba(61,138,255,0.1)' }}>📋</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Nouveau commentaire — Refonte Site Web</div><div className="notif-desc">Client TechCorp : &ldquo;Super progression sur la page d'accueil ! Quelques ajustements couleurs.&rdquo;</div></div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}><div className="notif-time">4h</div><div className="unread-dot"></div></div>
                        </div>
                    </div>

                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '6px' }}>Lues</div>
                    <div className="card">
                        <div className="notif-item" style={{ opacity: 0.65 }}>
                            <div className="notif-ico" style={{ background: 'rgba(79,255,176,0.08)' }}>🎉</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Projet Dashboard Atlas livré</div><div className="notif-desc">Groupe Atlas a validé la livraison. Satisfaction 5/5.</div></div>
                            <div className="notif-time">Hier</div>
                        </div>
                        <div className="notif-item" style={{ opacity: 0.65 }}>
                            <div className="notif-ico" style={{ background: 'rgba(167,139,250,0.08)' }}>🔔</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Rappel — Réunion TechCorp demain</div><div className="notif-desc">Réunion de suivi Mar 4 Mars à 10h00 via Zoom.</div></div>
                            <div className="notif-time">Hier</div>
                        </div>
                        <div className="notif-item" style={{ opacity: 0.65 }}>
                            <div className="notif-ico" style={{ background: 'rgba(255,203,71,0.08)' }}>📊</div>
                            <div style={{ flex: 1 }}><div className="notif-title">Rapport mensuel Fév 2025 généré</div><div className="notif-desc">Le rapport automatique IA est prêt. CA : 121 000 MAD.</div></div>
                            <div className="notif-time">1 Mar</div>
                        </div>
                    </div>
                </div>

                <div className="col-stack">
                    <div className="card">
                        <div className="card-header"><div className="card-title">Préférences de notification</div></div>
                        <div style={{ padding: '4px 0' }}>
                            {[
                                { key: 'delais' as const, label: 'Alertes délais critiques', desc: 'Notifier si < 7 jours avant échéance' },
                                { key: 'surcharge' as const, label: 'Surcharge ressources', desc: 'Alerte si charge > 100%' },
                                { key: 'commentaires' as const, label: 'Commentaires clients', desc: 'Nouveaux messages et retours' },
                                { key: 'resume' as const, label: 'Résumé quotidien IA', desc: 'Synthèse chaque matin à 8h' },
                                { key: 'budgets' as const, label: 'Dépassements budgétaires', desc: 'Alerte si > 90% budget consommé' },
                                { key: 'email' as const, label: 'Notifications email', desc: 'Envoyer par email également' },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="settings-row">
                                    <div className="settings-info">
                                        <div className="settings-label">{label}</div>
                                        <div className="settings-desc">{desc}</div>
                                    </div>
                                    <div className={`toggle ${toggles[key] ? 'on' : ''}`} onClick={() => toggle(key)}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
